import DyteAWSTranscribe from './AWSTranscribe';
import type { TranscriptionData } from './types';

export type {
    TranscriptionData,
};

if (typeof window !== 'undefined') {
    // Putting it on wimdow to allow import using scipt tag in plain HTML, JS solutions.
    Object.assign(window, { DyteAWSTranscribe });
}

export default DyteAWSTranscribe;
