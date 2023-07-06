import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import crypto from 'node:crypto';
import { createPresignedURL } from './aws-signature-v4';
import appConfig from './appConfig';
import getTranslatedText from './aws-translate';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS' }));

app.get('/aws-transcribe-presigned-url', async (req: Request, res: Response) => {
    const { sampleRate, sourceLanguageCode } = req.query as unknown as {
        sampleRate: number,
        sourceLanguageCode: string
    };
    const endpoint = `transcribestreaming.${appConfig.region}.amazonaws.com:8443`;

    // get a preauthenticated URL that we can use to establish our WebSocket
    const signedUrl = createPresignedURL(
        'GET',
        endpoint,
        '/stream-transcription-websocket',
        'transcribe',
        crypto.createHash('sha256').update('', 'utf8').digest('hex'),

        {
            key: appConfig.awsAccessKeyId,
            secret: appConfig.awsSecretAccessKey,
            protocol: 'wss',
            expires: 15,
            region: appConfig.region,
            query: `language-code=${sourceLanguageCode}&media-encoding=pcm&sample-rate=${sampleRate}`,
        },
    );

    return res.json({
        success: true,
        data: { signedUrl },
    });
});

app.get('/translate', async (req: Request, res: Response) => {
    const {
        text,
        sourceLanguageCode,
        targetLanguageCode,
    } = req.query as unknown as {
        text: string, sourceLanguageCode: string, targetLanguageCode: string
    };

    const translatedTextResponse = await getTranslatedText({
        sourceLanguageCode,
        targetLanguageCode,
        text,
    });

    if (!translatedTextResponse.isSuccessful) {
        return res.status(400).json({
            success: false,
            error: translatedTextResponse.error,
        });
    }
    return res.json({
        success: true,
        data: {
            translatedText: translatedTextResponse.data.translatedText,
        },
    });
});

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
