export const SYSTEM_DATA = {
  identity: {
    name: 'Aryan Bhagwan Patil',
    mark: 'RN',
    title: 'RIGHT NOW',
    statement: 'A living field of work, experiments and observations.',
  },
  core: {
    id: 'core',
    label: 'RN / RIGHT NOW',
    kicker: 'THE ORIGIN POINT',
    title: 'This is the system.',
    description: 'You are inside Aryan Bhagwan Patil working universe. Move through it at your own pace — every orbit is a different way of making, testing or thinking.',
    color: '#f7d98b',
    kind: 'core',
  },
  nodes: [
    {
      id: 'projects', label: 'PROJECTS', kicker: 'BUILT WORLDS', color: '#8fc7ff', orbit: 4.1, size: 0.52, speed: 0.0025, tilt: 0.08,
      description: 'Things that made it out of the notebook and into the world. Each project is a small world with its own gravity.',
      fields: [['STATUS', 'in motion'], ['OBJECTS', '3 worlds']],
      projects: [
        { name: 'RN Universe', description: 'A spatial portfolio that turns a body of work into an explorable system.', date: '2026', technologies: 'Three.js · WebGL · JavaScript', url: 'https://rn-universe.github.io', github: 'https://github.com/rn-universe/rn-universe.github.io' },
        { name: 'Signal / Noise', description: 'A visual study of finding useful structure inside an overwhelming stream.', date: '2026', technologies: 'Creative coding · Data', url: '#', github: '#' },
        { name: 'Open Orbit', description: 'A small experiment in making personal tools feel more like places than pages.', date: '2025', technologies: 'JavaScript · Interaction', url: '#', github: '#' },
      ],
    },
    {
      id: 'experiments', label: 'EXPERIMENTS', kicker: 'UNSTABLE MATTER', color: '#d5a7ff', orbit: 5.65, size: 0.43, speed: -0.0018, tilt: -0.18,
      description: 'Prototypes, strange interfaces and questions that are more interesting before they have answers.',
      fields: [['STATE', 'volatile'], ['ORBIT', 'non-linear']],
      experiments: ['A comet made of unfinished ideas', 'Interfaces that respond to attention', 'A quieter kind of notification'],
    },
    {
      id: 'ideas', label: 'IDEAS', kicker: 'POTENTIAL ENERGY', color: '#8fe2c5', orbit: 7.15, size: 0.39, speed: 0.00115, tilt: 0.23,
      description: 'Future forms waiting for the right question, the right constraint or the right moment.',
      fields: [['HORIZON', 'open'], ['NEXT', 'unwritten']],
      ideas: ['A personal operating system for creative work', 'Tools that make reflection observable', 'Small software with long afterlives'],
    },
    {
      id: 'notes', label: 'NOTES', kicker: 'FIELD RECORDINGS', color: '#ffd4a1', orbit: 8.65, size: 0.34, speed: -0.0008, tilt: -0.1,
      description: 'Observations from the edge of the work: what I am learning, noticing and returning to.',
      fields: [['FORMAT', 'fragments'], ['SIGNAL', 'curious']],
      notes: ['On making space for better questions', 'Why the best tools disappear', 'Learning in public, one orbit at a time'],
    },
    {
      id: 'about', label: 'ABOUT', kicker: 'THE OBSERVER', color: '#ffad9a', orbit: 10.15, size: 0.48, speed: 0.00062, tilt: 0.15,
      description: 'Aryan Bhagwan Patil is a developer and creative technologist interested in software that feels clear, alive and distinctly human.',
      fields: [['BASE', 'India'], ['MODE', 'building']],
    },
    {
      id: 'archive', label: 'ARCHIVE', kicker: 'COLD STORAGE', color: '#9aa6b8', orbit: 11.55, size: 0.3, speed: -0.00042, tilt: -0.27,
      description: 'Older work, abandoned paths and completed experiments. Not everything needs to remain active to remain useful.',
      fields: [['LIGHT', 'dimmed'], ['ACCESS', 'open']],
      archive: ['Older prototypes', 'Retired directions', 'Work that taught the next thing'],
    },
  ],
};

export const SCALE_DATA = {
  rn: { label: 'RN SYSTEM', sub: 'close orbit', position: [0, 8, 19], target: [0, 0, 0] },
  solar: { label: 'SOLAR SYSTEM', sub: 'wider perspective', position: [0, 72, 250], target: [0, 0, 0] },
  galaxy: { label: 'MILKY WAY', sub: 'outer boundary', position: [0, 190, 980], target: [0, 0, 0] },
};
