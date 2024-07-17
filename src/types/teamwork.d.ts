/**
 * Callback type for event handling functions.
 * @callback EventCallback
 * @param {unknown} message - The message or data passed to the callback.
 */
type EventCallback = (message: unknown) => void;

/**
 * Represents a member of a team.
 * @typedef {Object} TeamMember
 * @property {string} id - Unique identifier for the team member.
 * @property {string} name - Name of the team member.
 * @property {string} avatar - URL or path to the team member's avatar image.
 * @property {"ADMIN" | "MEMBER" | "OBSERVER"} authority - Authority level of the team member.
 * @property {string} role - Role of the team member within the team.
 * @property {boolean} online - Indicates if the team member is currently online.
 * @property {string} color - Color associated with the team member.
 */
interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  authority: "ADMIN" | "MEMBER" | "OBSERVER";
  role: string;
  online: boolean;
  color: string;
}

/**
 * Represents an online user.
 * @typedef {Object} OnlineUsers
 * @property {string} userId - Unique identifier for the user.
 * @property {string} clientId - Unique identifier for the client connection.
 * @property {string} [editingTargetId] - Optional ID of the target currently being edited by the user.
 * @property {Record<string, unknown>} [draggingBlocks] - Optional record of blocks the user is currently dragging.
 * @property {Array<string>} [scope] - Optional array of strings representing the scope of the user's actions.
 * @property {string} [authority] - Optional authority level of the user, which can be overridden.
 * @property {boolean} [ownsScope] - Optional boolean indicating if the user owns the current scope.
 * @property {TeamMember} userInfo - The user's information represented by the TeamMember interface.
 */
interface OnlineUsers {
  userId: string;
  clientId: string;
  userInfo: TeamMember;
  scope?: Array<string>;
  authority?: string;
  ownsScope?: boolean;
  editingTargetId?: string;
  draggingBlocks?: Record<string, unknown>;
}

/**
 * Interface representing user information.
 */
interface IUserInfo {
  /** Unique identifier for the user(oid) */
  id: string;
  /** Client identifier associated with the user */
  clientId: string;
  /** Name of the user */
  name: string;
  /** URL or path to the user's avatar */
  avatar: string;
  /** Indicates if the user is a new member */
  isNewMember: boolean;
  /** Optional authority level of the user, can be "ADMIN", "MEMBER", or "OBSERVER" */
  authority?: "ADMIN" | "MEMBER" | "OBSERVER";
  /** Optional ID of the target currently being edited by the user */
  editingTargetId?: string;
  /** Optional array of scopes associated with the user */
  scope?: Array<string>;
}

/**
 * Interface representing creation information.
 */
interface ICreationInfo {
  /** Unique identifier for the creation */
  id: string;
  /** Optional timestamp of when the creation was last updated */
  updatedAt?: string;
  /**
   * Optional callback function to handle updates to the creation.
   *
   * @param {Object} params - Parameters for updating the creation.
   * @param {string} [params.title] - New title for the creation.
   * @param {"LANDSCAPE" | "PORTRAIT" | "STANDARD"} [params.screenMode] - New screen mode for the creation.
   */
  handleUpdate?: (params: { title?: string; screenMode?: "LANDSCAPE" | "PORTRAIT" | "STANDARD" }) => void;
}

/**
 * Manages team collaboration features within the application.
 * @interface TeamworkManager
 */
declare interface TeamworkManager {
  /**
   * Read-only information about the user
   */
  userInfo: Readonly<IUserInfo>;

  /**
   * Read-only information about the creation
   */
  creationInfo: Readonly<ICreationInfo>;

  /**
   * Readonly array of TeamMember objects representing the team members.
   * @type {Readonly<Array<TeamMember>>}
   */
  teamMembers: Readonly<Array<TeamMember>>;

  /**
   * Readonly map of OnlineUsers objects representing the online users.
   * @type {Readonly<Map<string, OnlineUsers>>}
   */
  onlineUsers: Readonly<Map<string, OnlineUsers>>;

  /**
   * Registers an event listener.
   * @param {string} event - The name of the event to listen for.
   * @param {EventCallback} callback - The callback function to execute when the event is triggered.
   */
  on(event: string, callback: EventCallback): void;

  /**
   * Removes an event listener.
   * @param {string} event - The name of the event to stop listening for.
   * @param {EventCallback} callback - The callback function to remove.
   */
  off(event: string, callback: EventCallback): void;

  /**
   * Emits an event.
   * @param {string} event - The name of the event to emit.
   * @param {unknown} [data] - Optional data to pass with the event.
   */
  emit(event: string, data?: unknown): void;

  /**
   * Sends a broadcast message to all users.
   * @param {Object} message - The message to broadcast.
   * @param {string} [message.toClient] - Optional client identifier to send the message to a specific client.
   * @param {Record<string, string>} [message] - Additional key-value pairs of string type.
   */
  sendBroadcastMessage(message: { toClient?: string; [key: string]: string }): void;
}
