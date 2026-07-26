import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  
    app.enableCors({
    origin: 'http://localhost:3000',
    
  });
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
