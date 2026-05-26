import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

function getCorsOrigins(): string[] {
  const configuredOrigins =
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    '';

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = getCorsOrigins();
  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend listening on port ${port}`);
}
bootstrap();
