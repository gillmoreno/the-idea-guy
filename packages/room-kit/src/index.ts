export { Y, isYMap } from "./yjs";
export { APP_ID, DEFAULT_APP_URL, DEFAULT_RELAY_URL } from "./constants";
export {
  adminKeyMaterial,
  deriveChannelKey,
  deriveKey,
  derivePinKey,
  deriveRoom,
  encrypt,
  decrypt,
  publicKeyMaterial,
  randomSaltHex,
  type SyncScope,
} from "./crypto";
export {
  generateAdminSecret,
  generateMemberId,
  generateMemberSecret,
  generateRoomCode,
  generateFamilyCode,
  generateParentSecret,
  generateSecret,
} from "./invite";
export { encodeCompactedState } from "./compactDoc";
export { hashDocState } from "./docStateHash";
export {
  pullRoomPublicChannel,
  type PullRoomPublicOptions,
  type PullRoomPublicResult,
} from "./pullRoomSync";
export { LocalFirstDoc, type CompactResult, type LocalFirstOptions, type SyncState } from "./sync";
export { DEFAULT_BACKGROUND_SYNC_PARALLEL } from "./backgroundSyncConstants";
export {
  frameCheckpoint,
  frameUpdate,
  MSG_CHECKPOINT,
  MSG_SYNC_END,
  MSG_UPDATE,
  unwrapFrame,
} from "./relayProtocol";
export {
  completionSignPayload,
  signCompletion,
  verifyCompletionSignature,
} from "./memberAuth";
export {
  adminJoinUrl,
  appOrigin,
  memberJoinUrl,
  parseDeepLink,
  parseJoinFromUrl,
  parseJoinLocation,
  parseRoomCodeFromLocation,
  parseAppSearchParams,
  qrFamilyJoin,
  qrMemberLink,
  qrParentUnlock,
  roomUrl,
  stripInviteParamsFromUrl,
  type DeepLink,
} from "./links";
export {
  acknowledgeRoomSeen,
  getContact,
  getRelayUrl,
  getRoomInvite,
  getVaultRoom,
  isBackgroundRoomSyncEnabled,
  isVaultSessionLocked,
  listContacts,
  listPendingRoomInvites,
  listVaultRooms,
  loadVault,
  patchVaultRoom,
  removeRoomInvite,
  removeVaultRoom,
  savePersona,
  saveVault,
  setBackgroundRoomSync,
  setInboxCursor,
  setRelayUrlOverride,
  setSessionVault,
  touchVaultRoom,
  upsertContact,
  upsertRoomInvite,
  upsertVaultRoom,
} from "./vault";
export {
  changeVaultPin,
  disableVaultLock,
  enableVaultLock,
  isVaultLockEnabled,
  readPlainVaultJson,
  readVaultLockMeta,
  unlockVaultWithPin,
  type VaultLockMeta,
  type VaultUnlockResult,
} from "./vaultLock";
export {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricUnlockAvailable,
  isBiometricUnlockEnabled,
  unlockVaultWithBiometric,
  type EnableBiometricResult,
} from "./vaultBio";
export {
  canExchangeMessages,
  canSendFriendRequest,
  contactDisplayName,
  shouldSyncInbox,
} from "./contacts";
export {
  contactCardFromPersona,
  encodeContactCard,
  generatePersonaKeys,
  importContactPublicKey,
  importPersonaPrivateKey,
  parseContactCard,
  type ContactCard,
  type PersonaKeyMaterial,
} from "./persona";
export {
  derivePairInboxAesKey,
  derivePairInboxKeyMaterial,
  derivePairInboxRelayRoom,
  canAcceptRoomInvite,
  newFriendAccept,
  newFriendRequest,
  newRoomInvite,
  pairRoomCode,
  parseInboxMessage,
  type InboxMessage,
  type RoomInviteMessage,
} from "./pairInbox";
export { deleteIdbDatabase, ensureIdbReady, idbHasValidSchema } from "./persistence";
export {
  deleteRoomLocalData,
  formatBytes,
  measureIndexedDbDatabase,
  measureRoomLocalBytes,
  persistenceDbName,
  roomPersistenceDbNames,
} from "./storageSize";
export {
  DECLARATIVE_TEMPLATE_ID,
  PENDING_TEMPLATE_ID,
} from "./types";
export { CURRENT_VAULT_VERSION } from "./types";
export type {
  AdminMemberRecord,
  AdminRoomMeta,
  ContactRecord,
  ContactStatus,
  DeviceVault,
  InboxCursor,
  MemberRole,
  PersonaRecord,
  RoomInviteRecord,
  RoomInviteStatus,
  PublicMemberRecord,
  PublicRoomMeta,
  TemplateId,
  TemplateKind,
  VaultRoom,
} from "./types";
