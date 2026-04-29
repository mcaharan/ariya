export const ALL_MENU_ITEMS = [
    { image: 'emg.png',   label: 'Emergency' },
    { image: 'mt-m.png',  label: 'Mandatory Tasks' },
    { image: 'f-c.png',   label: 'Face Sheet' },
    { image: 'at.png',    label: 'Ariya Status' },
    { image: 'arts.png',  label: 'Ariya Behavior' },
    { image: 'm.png',     label: 'Medication' },
    { image: 'sleep.png', label: 'Sleep' },
    { image: 't.png',     label: 'Task' },
    { image: 'team.png',  label: 'Team' },
];

export const CONTENT_TYPES = [
    { value: 'link',  label: 'Link (URL)' },
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' },
    { value: 'pdf',   label: 'PDF' },
];

export const EMERGENCY_CONTENT_TYPES = [
    { value: 'text',  label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'pdf',   label: 'PDF' },
    { value: 'video', label: 'Video URL' },
    { value: 'link',  label: 'Link URL' },
];

export const TEAM_CONTENT_TYPES = [
    { value: 'text',  label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'pdf',   label: 'PDF' },
    { value: 'video', label: 'Video URL' },
    { value: 'link',  label: 'Link URL' },
    { value: 'quiz',  label: 'Quiz' },
    { value: 'map',   label: 'Map to Menu' },
];

export const PAGE_HEADER_SLOTS = [
    { key: 'emergency',       label: 'Emergency' },
    { key: 'mandatory-tasks', label: 'Mandatory Tasks' },
    { key: 'medication',      label: 'Medication' },
    { key: 'team-training',   label: 'Team Training' },
    { key: 'ariya-status',    label: 'Ariya Tube' },
    { key: 'ariya-behavior',  label: 'Ariya Art' },
];

export const SECTIONS = [
    { key: 'dashboard-menu',  label: 'Dashboard Menu',  image: null },
    { key: 'emergency',       label: 'Emergency',        image: 'emg.png' },
    { key: 'mandatory-tasks', label: 'Mandatory Tasks',  image: 'mt-m.png' },
    { key: 'face-sheet',      label: 'Face Sheet',       image: 'f-c.png' },
    { key: 'ariya-tube',      label: 'Ariya Tube',       image: 'at.png' },
    { key: 'ariya-art',       label: 'Ariya Art',        image: 'arts.png' },
    { key: 'sleep',           label: 'Sleep',            image: 'sleep.png' },
    { key: 'team-training',   label: 'Team Training',    image: 't.png' },
    { key: 'medication',      label: 'Medication',       image: 'm.png' },
    { key: 'page-headers',    label: 'Page Headers',     image: null },
    { key: 'ariya-team',      label: 'Ariya Team',       image: 'ariya-team.png' },
];

export const IMAGE_TO_SECTION = {
    'emg.png':   'Emergency',
    'mt-m.png':  'Mandatory Tasks',
    'f-c.png':   'Face Sheet',
    'at.png':    'Ariya Tube',
    'arts.png':  'Ariya Art',
    'm.png':     'Medication',
    'sleep.png': 'Sleep',
    't.png':     'Team Training',
    'team.png':  'Team',
};
