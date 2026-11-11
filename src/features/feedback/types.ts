/** A conversation in the list: GET /v1/feedback/list. */
export type FeedbackChat = {
  id: number
  userId: number
  userName?: string | null
  /** Unread messages from the user */
  notification?: number | null
}

/** A message: GET /v1/feedback/list/{userId}. */
export type FeedbackMessage = {
  id: number
  chatId: number
  /** Who sent it; the admin's messages have ADMIN_USER_ID */
  userId: number
  /** Sender's name, shown over the user's messages */
  sender?: string | null
  content?: string | null
  /** A picture: /v1/file/message/img/{imgId} */
  imgId?: number | null
  sendDate?: string | null
  /** The user has read the admin's message */
  isChecked?: boolean | null
}
