export const SAVE_MESSAGE_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000
  },
  removeOnComplete: true,
  removeOnFail: false
}