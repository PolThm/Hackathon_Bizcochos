/**
 * Max width (px) for app content, matching MUI Container maxWidth='xs'.
 * Use for modals, dialogs, and any content that should align with the layout.
 * Note: MUI Dialog maxWidth='xs' uses this value internally.
 */
export const CONTENT_MAX_WIDTH = 444;

/** Side spacing (px) reserved on each side of modals/dialogs (e.g. padding/margin). */
export const MODAL_SIDE_SPACING = 24;

/**
 * Max width (px) for modal/dialog content so that modal + side spacing fits within CONTENT_MAX_WIDTH.
 * Use this for Modal and Dialog maxWidth so there is consistent space on the sides.
 */
export const MODAL_MAX_WIDTH = CONTENT_MAX_WIDTH - 2 * MODAL_SIDE_SPACING;
