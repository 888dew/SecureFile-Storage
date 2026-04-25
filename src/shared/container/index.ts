import 'reflect-metadata';
import { AppDataSource } from '@infrastructure/database/typeorm/data-source';
import { RedisProvider } from '@infrastructure/providers/cache/RedisProvider';
import { JwtTokenProvider } from '@infrastructure/providers/token/JwtTokenProvider';
import { BcryptHashProvider } from '@infrastructure/providers/hash/BcryptHashProvider';
import { LocalStorageProvider } from '@infrastructure/providers/storage/LocalStorageProvider';
import { S3StorageProvider } from '@infrastructure/providers/storage/S3StorageProvider';
import { MockVirusScanProvider } from '@infrastructure/providers/virus-scan/MockVirusScanProvider';

// Repositories
import { TypeOrmUserRepository } from '@infrastructure/database/typeorm/repositories/TypeOrmUserRepository';
import { TypeOrmFileRepository } from '@infrastructure/database/typeorm/repositories/TypeOrmFileRepository';
import { TypeOrmFileVersionRepository } from '@infrastructure/database/typeorm/repositories/TypeOrmFileVersionRepository';
import { TypeOrmShareRepository } from '@infrastructure/database/typeorm/repositories/TypeOrmShareRepository';

// Use Cases — Auth
import { RegisterUseCase } from '@application/auth/use-cases/RegisterUseCase';
import { LoginUseCase } from '@application/auth/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '@application/auth/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '@application/auth/use-cases/LogoutUseCase';

// Use Cases — Files
import { UploadFileUseCase } from '@application/file/use-cases/UploadFileUseCase';
import { DownloadFileUseCase } from '@application/file/use-cases/DownloadFileUseCase';
import { ListFilesUseCase } from '@application/file/use-cases/ListFilesUseCase';
import { DeleteFileUseCase } from '@application/file/use-cases/DeleteFileUseCase';
import { GetFileVersionsUseCase } from '@application/file/use-cases/GetFileVersionsUseCase';

// Use Cases — Shares
import { GenerateShareUrlUseCase } from '@application/share/use-cases/GenerateShareUrlUseCase';
import { AccessSharedFileUseCase } from '@application/share/use-cases/AccessSharedFileUseCase';

// Controllers
import { AuthController } from '@presentation/http/controllers/AuthController';
import { FileController } from '@presentation/http/controllers/FileController';
import { ShareController } from '@presentation/http/controllers/ShareController';

import { env } from '@shared/config/env';
import { IStorageProvider } from '@application/ports/IStorageProvider';

export interface Container {
  authController: AuthController;
  fileController: FileController;
  shareController: ShareController;
  redisProvider: RedisProvider;
}

export async function bootstrap(): Promise<Container> {
  // Infrastructure — Providers
  const redisProvider = new RedisProvider();
  await redisProvider.connect();

  const tokenProvider = new JwtTokenProvider();
  const hashProvider = new BcryptHashProvider();
  const virusScanProvider = new MockVirusScanProvider();

  const storageProvider: IStorageProvider =
    env.STORAGE_PROVIDER === 's3'
      ? new S3StorageProvider()
      : new LocalStorageProvider();

  // Infrastructure — Repositories
  const userRepository = new TypeOrmUserRepository(AppDataSource);
  const fileRepository = new TypeOrmFileRepository(AppDataSource);
  const fileVersionRepository = new TypeOrmFileVersionRepository(AppDataSource);
  const shareRepository = new TypeOrmShareRepository(AppDataSource);

  // Application — Auth Use Cases
  const registerUseCase = new RegisterUseCase(
    userRepository, hashProvider, tokenProvider, redisProvider,
  );
  const loginUseCase = new LoginUseCase(
    userRepository, hashProvider, tokenProvider, redisProvider,
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(
    tokenProvider, redisProvider, userRepository,
  );
  const logoutUseCase = new LogoutUseCase(tokenProvider, redisProvider);

  // Application — File Use Cases
  const uploadFileUseCase = new UploadFileUseCase(
    fileRepository, fileVersionRepository, userRepository,
    storageProvider, virusScanProvider, redisProvider,
  );
  const downloadFileUseCase = new DownloadFileUseCase(fileRepository, storageProvider);
  const listFilesUseCase = new ListFilesUseCase(fileRepository);
  const deleteFileUseCase = new DeleteFileUseCase(
    fileRepository, fileVersionRepository, shareRepository,
    userRepository, storageProvider, redisProvider,
  );
  const getFileVersionsUseCase = new GetFileVersionsUseCase(
    fileVersionRepository, fileRepository,
  );

  // Application — Share Use Cases
  const generateShareUrlUseCase = new GenerateShareUrlUseCase(
    shareRepository, fileRepository, redisProvider,
  );
  const accessSharedFileUseCase = new AccessSharedFileUseCase(
    shareRepository, fileRepository, storageProvider, redisProvider,
  );

  // Presentation — Controllers
  const authController = new AuthController(
    registerUseCase, loginUseCase, refreshTokenUseCase, logoutUseCase,
  );
  const fileController = new FileController(
    uploadFileUseCase, downloadFileUseCase, listFilesUseCase,
    deleteFileUseCase, getFileVersionsUseCase,
  );
  const shareController = new ShareController(
    generateShareUrlUseCase, accessSharedFileUseCase,
  );

  return { authController, fileController, shareController, redisProvider };
}
