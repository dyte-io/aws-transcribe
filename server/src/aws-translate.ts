import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import appConfig from './appConfig';

const client = new TranslateClient({
    region: appConfig.region,
    credentials: {
        accessKeyId: appConfig.awsAccessKeyId,
        secretAccessKey: appConfig.awsSecretAccessKey,
    },
});

export default async function getTranslatedText({
    sourceLanguageCode,
    targetLanguageCode,
    text,
}: {
    sourceLanguageCode: string,
    targetLanguageCode: string,
    text: string,
}) {
    const command = new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: sourceLanguageCode,
        TargetLanguageCode: targetLanguageCode,
    });
    try {
        const response = await client.send(command);
        return { isSuccessful: true, data: { translatedText: response.TranslatedText } };
    } catch (error) {
        return { isSuccessful: false, error };
    }
}
