import dotenv from 'dotenv';

dotenv.config();

const {
    REGION = 'ap-south-1',
    NODE_ENV,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
} = process.env;

const appConfig: {
    region: string,
    nodeENV: 'dev' | 'staging' | 'prod',
    awsAccessKeyId: string,
    awsSecretAccessKey: string,
} = {
    region: REGION,
    awsAccessKeyId: AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: AWS_SECRET_ACCESS_KEY,
    nodeENV: NODE_ENV as any,
};

export default appConfig;
