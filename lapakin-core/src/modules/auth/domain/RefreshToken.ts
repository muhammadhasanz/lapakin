import { Entity, type UniqueId } from '@/shared/index.ts';
import { RefreshTokenId } from './RefreshTokenId.ts';

export interface RefreshTokenProps {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
}

export class RefreshToken extends Entity<RefreshTokenProps> {
  get id(): string {
    return this._id.toString();
  }

  get userId(): string {
    return this.props.userId;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get revokedAt(): Date | null | undefined {
    return this.props.revokedAt;
  }

  private constructor(props: RefreshTokenProps, id?: UniqueId) {
    super(props, id);
  }

  public static create(props: RefreshTokenProps, id?: UniqueId): RefreshToken {
    return new RefreshToken(props, id ?? new RefreshTokenId());
  }
}
