import { DyteParticipants, DyteSelf } from '@dytesdk/web-core';
import './utils/logger';
import { Buffer } from 'buffer';

import * as marshaller from '@aws-sdk/eventstream-marshaller'; // for converting binary event stream messages to and from JSON
import * as utilUTF8Node from '@aws-sdk/util-utf8-node'; // utilities for encoding and decoding UTF8
import emitter from './utils/emitter';
import {
    AWSTranscribeOptions,
    TranscriptionData,
} from './types';

// eslint-disable-next-line import/extensions, import/no-unresolved
import recorderWorkerUrl from './utils/recorderWorkletProcessor.js?url';

// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
    utilUTF8Node.toUtf8,
    utilUTF8Node.fromUtf8,
);

async function createWorkletNode(
    context: BaseAudioContext,
    name: string,
    url: string,
) {
    // ensure audioWorklet has been loaded
    try {
        return new AudioWorkletNode(context, name);
    } catch (err) {
        await context.audioWorklet.addModule(url);
        return new AudioWorkletNode(context, name);
    }
}

class AWSTranscribe {
    public transcriptions: TranscriptionData[];

    public source: string;

    public sampleRate: number;

    public target: string;

    public translate: boolean;

    public preSignedUrlEndpoint: string;

    public translationEndpoint: string;

    #self: DyteSelf;

    #participants: DyteParticipants;

    #inputSampleRate: number;

    #hasSocketError: boolean;

    #hasTranscribeException: boolean;

    #socket: WebSocket;

    #audioContext: AudioContext;

    #mediaStream: MediaStream;

    #mediaStreamSourceNode: MediaStreamAudioSourceNode;

    #processor: AudioWorkletNode;

    constructor(options: AWSTranscribeOptions) {
        this.#self = options.meeting.self;
        this.preSignedUrlEndpoint = options.preSignedUrlEndpoint;
        this.translationEndpoint = options.translationEndpoint;
        this.#participants = options.meeting.participants;
        this.sampleRate = options.sampleRate ?? 16000;
        this.transcriptions = [];
        this.source = options.source ?? 'en-US';
        this.target = options.target ?? 'hi';
        this.translate = options.translate;

        this.#participants.on('broadcastedMessage', (data: { type: string, payload: TranscriptionData}) => {
            if (data.type !== 'newTranscription') return;

            /**
             * NOTE(ravindra-dyte): We want to give the effect of in-place transcription update
             * Therefore we are removing previously in-progress line and putting the new one
            */

            // Remove all in-progress transcriptions of this user
            const filteredTranscriptions: TranscriptionData[] = [];
            this.transcriptions.forEach((transcription) => {
                const shouldKeep = transcription.id !== data.payload?.id // allow from others
            || ( // allow this peerId messages only if they are completed
                transcription.id === data.payload?.id
                    && !transcription.isPartialTranscript
            );
                if (shouldKeep) {
                    filteredTranscriptions.push(transcription);
                }
            });

            filteredTranscriptions.push(data.payload);
            this.transcriptions = filteredTranscriptions;

            emitter().emit('transcription', data.payload);
        });
    }

    on(eventName: 'transcription', listener: (...args: any[]) => void) {
        return emitter().on(eventName, listener);
    }

    async streamAudioToWebSocket() {
        const signedUrlResponse = await fetch(`${this.preSignedUrlEndpoint}?sampleRate=${this.sampleRate}&sourceLanguageCode=${this.source}`);
        const websocketURL = (await signedUrlResponse.json()).data.signedUrl;

        // open up our WebSocket connection
        this.#socket = new WebSocket(websocketURL);
        this.#socket.binaryType = 'arraybuffer';

        this.#audioContext = new AudioContext({
            latencyHint: 'interactive',
        });

        this.#mediaStream = new MediaStream([this.#self.audioTrack]);
        this.#mediaStreamSourceNode = this.#audioContext.createMediaStreamSource(this.#mediaStream);
        this.#processor = await createWorkletNode(this.#audioContext, 'recorder.worklet', recorderWorkerUrl);
        this.#processor.connect(this.#audioContext.destination);
        this.#audioContext.resume();
        this.#mediaStreamSourceNode.connect(this.#processor);
        this.#socket.onopen = () => {
            this.#processor.port.onmessage = (e) => {
                const audioData = e.data;
                const binary = this.convertAudioToBinaryMessage(audioData);

                if (binary && this.#socket.readyState === this.#socket.OPEN) {
                    this.#socket.send(binary);
                }
            };
        };

        // handle messages, errors, and close events
        this.handleWebsocketEvents();
    }

    async handleWebsocketEvents() {
        // handle inbound messages from Amazon Transcribe
        this.#socket.onmessage = async (message) => {
            // convert the binary event stream message to JSON
            const messageWrapper = eventStreamMarshaller.unmarshall(Buffer.from(message.data));
            // eslint-disable-next-line prefer-spread
            const messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
            if (messageWrapper.headers[':message-type'].value === 'event') {
                await this.handleEventStreamMessage(messageBody);
            } else {
                this.#hasTranscribeException = true;
            }
        };

        this.#socket.onerror = () => {
            this.#hasSocketError = true;
            console.log('WebSocket connection error. Try again.');
        };

        this.#socket.onclose = (closeEvent) => {
            // the close event immediately follows the error event; only handle one.
            if (!this.#hasSocketError && !this.#hasTranscribeException) {
                if (closeEvent.code !== 1000) {
                    console.log(`Streaming Exception: ${closeEvent.reason}`);
                }
            }
        };
    }

    convertAudioToBinaryMessage(downsampledBuffer: Buffer) {
        // add the right JSON headers and structure to the message
        const audioEventMessage = this.getAudioEventMessage(
            Buffer.from(downsampledBuffer),
        ) as marshaller.Message;

        // convert the JSON object + headers into a binary event stream message
        const binary = eventStreamMarshaller.marshall(audioEventMessage);
        return binary;
    }

    getAudioEventMessage(buffer: Buffer) {
        return {
            headers: {
                ':message-type': {
                    type: 'string',
                    value: 'event',
                },
                ':event-type': {
                    type: 'string',
                    value: 'AudioEvent',
                },
            },
            body: buffer,
        };
    }

    async handleEventStreamMessage(messageJson: { Transcript: { Results: any; }; }) {
        const results = messageJson.Transcript.Results;

        if (results.length > 0) {
            if (results[0].Alternatives.length > 0) {
                let transcript = results[0].Alternatives[0].Transcript;
                transcript = decodeURIComponent(escape(transcript));

                if (this.translate) {
                    const translationResponse = await fetch(`${this.translationEndpoint}?sourceLanguageCode=${this.source}&targetLanguageCode=${this.target}&text=${encodeURIComponent(transcript)}`);
                    transcript = (await translationResponse.json()).data.translatedText;
                }

                // Send the transcription to all peers
                const transcriptionPayload: TranscriptionData = {
                    name: this.#self.name,
                    id: this.#self.id,
                    transcript,
                    isPartialTranscript: results[0].IsPartial,
                    date: new Date(),
                };
                this.#participants.broadcastMessage('newTranscription', transcriptionPayload);
            }
        }
    }

    async closeSocket() {
        if (this.#socket && this.#socket.readyState === this.#socket.OPEN) {
            // Send an empty frame so that Transcribe initiates a closure of the WebSocket,
            // after submitting all transcripts
            const emptyMessage = this.getAudioEventMessage(
                Buffer.from(Buffer.from([])),
            ) as marshaller.Message;
            const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
            this.#socket.send(emptyBuffer);
            this.#mediaStreamSourceNode?.disconnect(this.#processor);
            this.#processor?.disconnect(this.#audioContext.destination);
            await this.#audioContext?.close();
            this.#socket.close();
        }
    }

    async transcribe() {
        this.#self.on('audioUpdate', async () => {
            if (this.#self.audioEnabled) {
                await this.closeSocket();
                await this.streamAudioToWebSocket();
            } else {
                await this.closeSocket();
            }
        });
        if (this.#self.audioEnabled) {
            await this.streamAudioToWebSocket();
        }
    }
}

export default AWSTranscribe;
