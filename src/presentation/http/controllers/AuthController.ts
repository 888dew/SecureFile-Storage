import { Request, Response, NextFunction } from 'express';
import { RegisterUseCase } from '@application/auth/use-cases/RegisterUseCase';
import { LoginUseCase } from '@application/auth/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '@application/auth/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '@application/auth/use-cases/LogoutUseCase';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.registerUseCase.execute(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.refreshTokenUseCase.execute({ refreshToken });
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1] ?? '';
      const { refreshToken } = req.body;
      await this.logoutUseCase.execute({ accessToken: token, refreshToken });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  me = (req: AuthenticatedRequest, res: Response): void => {
    res.status(200).json({ status: 'success', data: { user: req.user } });
  };
}
