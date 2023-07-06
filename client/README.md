<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://dyte.io">
    <img src="https://dyte-uploads.s3.ap-south-1.amazonaws.com/dyte-logo-dark.svg" alt="Logo" width="80">
  </a>
  <h2 align="center">AWS Transcribe & translations by Dyte</h3>
  <p align="center">
    <br />
    <a href="https://docs.dyte.io"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/dyte-in/aws-transcribe/issues">Report Bug</a>
    •
    <a href="https://github.com/dyte-in/aws-transcribe/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
## Table of Contents
- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  <!-- - [Quickstart](#quickstart) -->
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## About The Project
This package provides audio transcriptions in various [languages](https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html).
### Built With
- [Dyte](https://dyte.io/)
- [Typescript](https://typescriptlang.org/)

<!-- GETTING STARTED -->
## Getting Started
### Prerequisites
- npm
- server, running https://github.com/dyte-in/aws-transcribe/tree/main/server, this runs a server on localhost:3001

### Installation
```sh
npm i @dytesdk/aws-transcribe
```

<!-- USAGE EXAMPLES -->
## Usage
A speech object can be created using `DyteAWSTranscribe` class.
```ts
import DyteAWSTranscribe from '@dytesdk/aws-transcribe';

const awsTranscribe = new DyteAWSTranscribe({
    meeting,
    target: 'hi', // Optional if translate is false, Supported languages: https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html
    translate: true, // Control whether to translate the source language to target language or just transcribe
    source: 'en-US', // Supported languages: https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html
    preSignedUrlEndpoint: 'http://localhost:3001/aws-transcribe-presigned-url',
    translationEndpoint: 'http://localhost:3001/translate',
});




awsTranscribe.on('transcription', async (data) => {
    // ... do something with transcription
    // console.log(speech.transcriptions);
});

awsTranscribe.transcribe();

```

## Contributing
We really appreciate contributions in the form of bug reports and feature suggestions. Help us make Dyte better with your valuable contributions on our [forum]('https://discord.com/invite/pxRcdNufvk') 🙂.

## License
All rights reserved. © Dyte Inc.
