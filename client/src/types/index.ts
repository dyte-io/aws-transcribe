import DyteClient from '@dytesdk/web-core';

type AWSTranscribeOptions = {
    meeting: DyteClient;
    source: string;
    target?: string;
    translate: true,
    preSignedUrlEndpoint: string;
    translationEndpoint: string;
    sampleRate?: number;
}

type Transcription = {
    results: {
        alternatives: {
            transcript: string;
        }[];
        languageCode: string;
        resultEndTime: string;
    }[];
}

type TranslatedText = {
    data: {
        translations: {
            translatedText: string,
        }[]
    }
}

type TranscriptionData = {
    id: string;
    name: string;
    transcript: string;
    isPartialTranscript: string;
    date: Date;
}

export {
    AWSTranscribeOptions,
    Transcription,
    TranscriptionData,
    TranslatedText,
};
