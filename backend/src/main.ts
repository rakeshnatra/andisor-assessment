import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://andisor-assessment.vercel.app',
      /^https:\/\/andisor-assessment-.*-rakeshnatras-projects\.vercel\.app$/,
    ],
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();