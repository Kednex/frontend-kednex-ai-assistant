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
    /** Stable id for the capability (drives the card icon). */
    id: 'visualise' | 'stylist';
    /** Short card title. */
    label: string;
    /** One-line example shown under the title. */
    example: string;
    /** Text dropped into the composer when the card is tapped. */
    prompt: string;
    /** Whether tapping the card opens the room-photo uploader. */
    opensUploader: boolean;
};

/**
 * "See it in your room" — the visualiser differentiator, for merchants whose
 * plan includes 3D room reconstruction. Tapping it prefills the composer and
 * opens the room-photo uploader.
 */
export const VISUALISE_CAPABILITY: OnboardingCapability = {
    id: 'visualise',
    label: 'See it in your room',
    example: 'Upload a photo and preview products in your space.',
    prompt: 'Here is my room, show me how products would look in this space.',
    opensUploader: true,
};

/**
 * "Upload your room" — the stylist value prop for merchants without the
 * visualiser. Same upload action, but framed around tailored recommendations
 * rather than 3D preview.
 */
export const STYLIST_CAPABILITY: OnboardingCapability = {
    id: 'stylist',
    label: 'Upload your room',
    example: 'Get product picks tailored to your space.',
    prompt: 'Here is my room, recommend products that would suit this space.',
    opensUploader: true,
};
