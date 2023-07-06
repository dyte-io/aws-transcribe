import DyteClient from '@dytesdk/web-core';
import { defineCustomElements } from '@dytesdk/ui-kit/loader/index.es2017';
import DyteAWSTranscribe, { TranscriptionData } from '../src/index';

defineCustomElements();

const init = async () => {
    try {
        const roomName = 'rjripe-ampvpu';
        const { authToken } = await (
            await fetch('https://api.cluster.dyte.in/auth/anonymous')
        ).json();

        const meeting = await DyteClient.init({
            authToken,
            roomName,
            apiBase: 'https://api.cluster.dyte.in',
            defaults: {
                audio: false,
                video: false,
            },
        });

        // Initialize speech client
        const awsTranscribe = new DyteAWSTranscribe({
            meeting,
            target: 'hi',
            translate: true,
            source: 'en-US',
            preSignedUrlEndpoint: 'http://localhost:3001/aws-transcribe-presigned-url',
            translationEndpoint: 'http://localhost:3001/translate',
        });

        // Listen for transcriptions
        awsTranscribe.on('transcription', async () => {
            const transcription = document.getElementById('dyte-transcriptions') as HTMLDivElement;
            const list = awsTranscribe.transcriptions.slice(-3);
            transcription.innerHTML = '';
            list.forEach((item: TranscriptionData) => {
                const speaker = document.createElement('span');
                speaker.classList.add('dyte-transcription-speaker');
                speaker.innerText = `${item.name}: `;

                const text = document.createElement('span');
                text.classList.add('dyte-transcription-text');
                text.innerText = item.transcript.trim() !== '' ? item.transcript : '...';

                const container = document.createElement('span');
                container.classList.add('dyte-transcription-line');
                container.appendChild(speaker);
                container.appendChild(text);

                transcription.appendChild(container);
            });
        });

        // Initialize transcriptions
        awsTranscribe.transcribe();

        (document.getElementById('my-meeting') as any).meeting = meeting;
    } catch (e) {
        console.log(e);
    }
};

init();
