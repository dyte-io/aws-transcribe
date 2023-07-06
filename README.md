# Dyte's AWS Transcribe Package

This package provides plug and play transcriptions & translations.

# Prerequisites

This package uses AWS transcribe & AWS translate, which are paid services, provided by amazon.

Therefore, You must have an iam account in your main AWS (Amazon Web Services) account that can deploy the services.

Once done, download the key containing your accessKeyId, secretAccessKey from the iam account for local testing. For production, if deployed using serverless, you may not need any keys.

To keep things simple, in this repo, you will be asked to put keys in .env file. Please alter the code as per the security standards of your application.

<b>Note:</b> Without having accessKeyId & secretAccessKey, this repo may not work properly.


# How to use

1. Go to server folder
```sh
cd server
```
2. Replicate .env.example as .env
```sh
cp .env.example .env
```

Open the .env in your choice of Text File Editor and Edit it and Save it.

3. Install packages
```sh
npm install
```
4. Run the server
```sh
npm run dev
```

If sucessful, you would see the confirmation in Terminal that it is running on localhost:3001 or the PORT specified in the .env file.

5. In a new terminal, go to the client folder from root of this repository

```sh
cd client
```

6. Install packages
```sh
npm install
```

7. Replicate .env.example as .env
```sh
cp .env.example .env
```
Modify port, if needed.

8. Run the client
```sh
npm run dev
```

9. Now go to browser and open localhost:3000 (Change this, if you have modified port in .env of client)

You would see the Dyte meeting loading on this page.

Turn the Mic on and Start Speaking in english (default language) and you should ideally start seeing transcriptions right away.

10. Go through the client/demo/index.ts & server folder and take what is needed to integrate it in your product.

<b>Note:</b> Though this package takes the complexity away from you, We recommend that you put your own security practices & robustness around it and not treat these samples as production-grade copy-paste solutions.


