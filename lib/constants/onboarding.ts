// Frontend-defined onboarding capabilities shown in the chat empty state.
//
// For the trial these are hardcoded here rather than driven by merchant
// config. Merchant `suggestions` stay flat strings (see merchant-sample.ts)
// and render as the example chips below the capability card(s).
//
// TODO [BACKEND]: If we later decide to make capabilities merchant-configurable,
// widen the merchant `suggestions` field to accept structured items instead of
// plain strings, e.g.:
//
//   type CapabilitySuggestion = {
//     capability: 'visualise' | 'search' | 'style' | 'general';
//     label: string;   // short card title, e.g. "See it in your room"
//     prompt: string;   // text dropped into the composer on tap
//   };
//   suggestions: Array<string | CapabilitySuggestion>;
//
// A plain string would normalise to { capability: 'general', label, prompt }.
// Until then, the only capability with distinct behaviour (opening the room
// uploader) is Visualise, defined below. My CTO prefers keeping the backend
// contract as simple prompt strings, so this stays frontend-only for now.

export type OnboardingCapability = {
    /** Stable id for the capability. */
    id: 'visualise';
    /** Short card title. */
    label: string;
    /** One-line example shown under the title. */
    example: string;
    /** Text dropped into the composer when the card is tapped. */
    prompt: string;
};

/**
 * "See it in your room" — the visualiser differentiator. Tapping it both
 * prefills the composer and opens the room-photo uploader.
 */
export const VISUALISE_CAPABILITY: OnboardingCapability = {
    id: 'visualise',
    label: 'See it in your room',
    example: 'Upload a photo and preview products in your space.',
    prompt: 'Here is my room — show me how products would look in this space.',
};
