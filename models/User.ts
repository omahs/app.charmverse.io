import type {
  DiscordUser,
  GoogleAccount,
  Role as RoleMembership,
  SpaceRole,
  SpaceRoleToRole,
  TelegramUser,
  UnstoppableDomain,
  User,
  UserNotificationState,
  UserWallet,
  VerifiedEmail
} from '@prisma/client';

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[];
}

export interface LoggedInUser extends User {
  favorites: { pageId: string }[];
  spaceRoles: (SpaceRole & NestedMemberships)[];
  wallets: Pick<UserWallet, 'address' | 'ensname'>[];
  unstoppableDomains: Pick<UnstoppableDomain, 'domain'>[];
  googleAccounts: Pick<GoogleAccount, 'email' | 'name'>[];
  verifiedEmails: Pick<VerifiedEmail, 'email' | 'name'>[];
  ensName?: string;
  discordUser?: DiscordUser | null;
  telegramUser?: TelegramUser | null;
  notificationState?: UserNotificationState | null;
  isNew?: boolean;
  profile?: {
    timezone?: string | null;
    locale?: string | null;
  } | null;
}
