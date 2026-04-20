import React from 'react'

/* ─────────────────────────────────────────────────────────────
   BillyMascot — personnage SVG inline, zéro asset externe

   Props :
     state     'idle' | 'listening' | 'writing' | 'done'
     size      largeur en px (hauteur calculée proportionnellement)
     className classes Tailwind / CSS supplémentaires

   Usage :
     <BillyMascot state="listening" size={160} />
───────────────────────────────────────────────────────────── */

// Palette — modifier ici pour changer toutes les couleurs d'un coup
const C = {
  skin:          '#F5D5B0',
  skinShade:     '#E4B88A',
  hair:          '#2A2A2A',
  shirt:         '#D8EAF5',
  shirtLine:     '#B5CAE0',
  glasses:       '#7B9BB5',
  glassesLens:   'rgba(123,155,181,0.10)',
  headphone:     '#C4B4A2',
  headphoneDark: '#9E8E7E',
  eye:           '#1C1C2E',
  eyeDeep:       '#0A0A1C',
  shine:         '#FFFFFF',
  cheek:         '#E88060',
  mouth:         '#BF7055',
  paper:         '#F7F9FC',
  paperLine:     '#BCCFE0',
  pen:           '#38384A',
  blue:          '#4A90D9',
  gold:          '#F5C218',
}

// Animations CSS injectées dans le SVG
const STYLES = `
  @keyframes billy-bob {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-2.5px); }
  }
  @keyframes billy-wave {
    0%,100% { opacity: 0; }
    25%,75% { opacity: 0.75; }
  }
  @keyframes billy-sparkle {
    0%,100% { opacity: 0; transform: scale(0.4); }
    50%     { opacity: 1;  transform: scale(1); }
  }
  .bb-bob { animation: billy-bob 3s ease-in-out infinite; transform-origin: 60px 65px; }
  .bb-w1  { animation: billy-wave 1.8s ease-in-out 0.00s infinite; }
  .bb-w2  { animation: billy-wave 1.8s ease-in-out 0.35s infinite; }
  .bb-w3  { animation: billy-wave 1.8s ease-in-out 0.70s infinite; }
  .bb-sp1 { animation: billy-sparkle 1.5s ease-in-out 0.0s  infinite; transform-origin: 14px 98px; }
  .bb-sp2 { animation: billy-sparkle 1.5s ease-in-out 0.55s infinite; transform-origin: 108px 93px; }
`

const STATE_LABELS = {
  idle:      'neutre',
  listening: 'écoute',
  writing:   'écriture',
  done:      'terminé',
}

/* ── Fragments SVG ──────────────────────────────────────────── */

function Body() {
  return (
    <g>
      <rect x="53" y="95" width="14" height="16" rx="6" fill={C.skin} />
      <rect x="28" y="106" width="64" height="36" rx="14" fill={C.shirt} />
      <ellipse cx="60" cy="141" rx="26" ry="3.5" fill={C.shirtLine} opacity="0.35" />
      <path d="M53 106 L60 117 L67 106" stroke={C.shirtLine} strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  )
}

function HeadbandBack() {
  return (
    <path
      d="M22 64 Q60 22 98 64"
      stroke={C.headphone}
      strokeWidth="5.5"
      strokeLinecap="round"
    />
  )
}

function Head({ pupilDY = 0, bigSmile = false }) {
  return (
    <g>
      {/* Cheveux (fond sombre, derrière le visage) */}
      <ellipse cx="60" cy="43" rx="35" ry="24" fill={C.hair} />

      {/* Oreilles — dessinées avant le visage pour être partiellement recouvertes */}
      <ellipse cx="28" cy="65" rx="5.5" ry="7.5" fill={C.skin} />
      <ellipse cx="92" cy="65" rx="5.5" ry="7.5" fill={C.skin} />
      <ellipse cx="28" cy="65" rx="3"   ry="4.5"  fill={C.skinShade} opacity="0.45" />
      <ellipse cx="92" cy="65" rx="3"   ry="4.5"  fill={C.skinShade} opacity="0.45" />

      {/* Visage */}
      <ellipse cx="60" cy="63" rx="32" ry="34" fill={C.skin} />

      {/* Mèche de cheveux (avant, retombe sur le front) */}
      <path d="M62 27 C73 29 82 38 77 49 C75 53 68 51 65 46 C62 41 58 33 62 27Z" fill={C.hair} />

      {/* Yeux */}
      <circle cx="47" cy="58" r="6.5" fill={C.eye} />
      <circle cx="73" cy="58" r="6.5" fill={C.eye} />
      <circle cx="47" cy={58 + pupilDY} r="4"   fill={C.eyeDeep} />
      <circle cx="73" cy={58 + pupilDY} r="4"   fill={C.eyeDeep} />
      <circle cx="49.5" cy={55.5 + pupilDY} r="1.8" fill={C.shine} />
      <circle cx="75.5" cy={55.5 + pupilDY} r="1.8" fill={C.shine} />

      {/* Lunettes — élément signature */}
      <circle cx="47" cy="58" r="10.5" stroke={C.glasses} strokeWidth="2"   fill={C.glassesLens} />
      <circle cx="73" cy="58" r="10.5" stroke={C.glasses} strokeWidth="2"   fill={C.glassesLens} />
      <line x1="57.5" y1="58" x2="62.5" y2="58" stroke={C.glasses} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="36.5" y1="57.5" x2="30.5" y2="60" stroke={C.glasses} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="83.5" y1="57.5" x2="89.5" y2="60" stroke={C.glasses} strokeWidth="1.5" strokeLinecap="round" />

      {/* Joues */}
      <ellipse cx="38" cy="72" rx="9"   ry="5.5" fill={C.cheek} opacity="0.17" />
      <ellipse cx="82" cy="72" rx="9"   ry="5.5" fill={C.cheek} opacity="0.17" />

      {/* Nez */}
      <circle cx="60" cy="70" r="1.5" fill={C.mouth} opacity="0.30" />

      {/* Bouche — sourire subtil (grand sourire en état done) */}
      <path
        d={bigSmile ? 'M51 78 Q60 87 69 78' : 'M54 77 Q60 83 66 77'}
        stroke={C.mouth}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  )
}

function EarCups({ listening = false }) {
  return (
    <g>
      <circle cx="22" cy="65" r="12"  fill={C.headphone} />
      <circle cx="22" cy="65" r="7.5" fill={C.headphoneDark} />
      <circle cx="22" cy="65" r="4"   fill={C.headphone} opacity="0.55" />
      <circle cx="98" cy="65" r="12"  fill={C.headphone} />
      <circle cx="98" cy="65" r="7.5" fill={C.headphoneDark} />
      <circle cx="98" cy="65" r="4"   fill={C.headphone} opacity="0.55" />
      {listening && (
        <>
          <line x1="22" y1="77" x2="18" y2="87" stroke={C.headphone} strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="88.5" r="2.5" fill={C.headphoneDark} />
        </>
      )}
    </g>
  )
}

function SoundWaves() {
  const w = { fill: 'none', stroke: C.blue, strokeWidth: '2', strokeLinecap: 'round' }
  return (
    <g>
      <path d="M107 56 Q115 65 107 74" {...w} className="bb-w1" />
      <path d="M112 51 Q122 65 112 79" {...w} className="bb-w2" />
      <path d="M117 46 Q129 65 117 84" {...w} className="bb-w3" />
    </g>
  )
}

function Writing() {
  return (
    <g>
      {/* Bras gauche (tient le papier) */}
      <path d="M37 117 Q27 124 31 133" stroke={C.skin} strokeWidth="10" strokeLinecap="round" />

      {/* Feuille de papier */}
      <rect x="20" y="122" width="42" height="18" rx="3" fill={C.paper} />
      <rect x="20" y="122" width="42" height="18" rx="3" stroke={C.paperLine} strokeWidth="1.2" />
      <line x1="25" y1="129" x2="58" y2="129" stroke={C.paperLine} strokeWidth="1.2" />
      <line x1="25" y1="134" x2="54" y2="134" stroke={C.paperLine} strokeWidth="1.2" strokeDasharray="2 1.5" />

      {/* Bras droit (tient le stylo) */}
      <path d="M84 117 Q95 124 90 134" stroke={C.skin} strokeWidth="10" strokeLinecap="round" />
      <circle cx="90" cy="134" r="5.5" fill={C.skin} />

      {/* Stylo — légère animation d'écriture */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-3 90 132;3 90 132;-3 90 132"
          dur="0.8s"
          repeatCount="indefinite"
        />
        <line x1="90" y1="130" x2="100" y2="143" stroke={C.pen} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100.5" cy="143.5" r="1.5" fill={C.blue} />
      </g>
    </g>
  )
}

function DoneArms() {
  return (
    <g>
      <path d="M37 117 Q27 125 33 134" stroke={C.skin} strokeWidth="10" strokeLinecap="round" />
      <path d="M83 117 Q93 125 87 134" stroke={C.skin} strokeWidth="10" strokeLinecap="round" />
    </g>
  )
}

function DoneDocument() {
  return (
    <g>
      {/* Ombre */}
      <rect x="30" y="111" width="60" height="28" rx="5" fill={C.paperLine} opacity="0.35" />
      {/* Document */}
      <rect x="28" y="108" width="64" height="28" rx="5" fill={C.paper} />
      <rect x="28" y="108" width="64" height="28" rx="5" stroke={C.paperLine} strokeWidth="1.5" />
      {/* Lignes */}
      <line x1="35" y1="117" x2="84" y2="117" stroke={C.paperLine} strokeWidth="1.5" />
      <line x1="35" y1="123" x2="84" y2="123" stroke={C.paperLine} strokeWidth="1.5" />
      <line x1="35" y1="129" x2="70" y2="129" stroke={C.paperLine} strokeWidth="1.5" />
      {/* Coche bleue */}
      <path
        d="M87 114 L90.5 118.5 L96 111.5"
        stroke={C.blue}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Étincelles */}
      <path d="M14 98 L15 94 L16 98 L20 99 L16 100 L15 104 L14 100 L10 99Z" fill={C.gold} className="bb-sp1" />
      <path d="M108 93 L109 90 L110 93 L113 94 L110 95 L109 98 L108 95 L105 94Z" fill={C.gold} className="bb-sp2" />
    </g>
  )
}

/* ── Composant principal ─────────────────────────────────────── */

export default function BillyMascot({ state = 'idle', size = 120, className = '' }) {
  const W = 120
  const H = 140

  const hasCans  = state === 'idle' || state === 'listening'
  const pupilDY  = state === 'writing' ? 1.5 : 0
  const bigSmile = state === 'done'

  return (
    <svg
      width={size}
      height={Math.round(size * H / W)}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Billy le scribe — ${STATE_LABELS[state] ?? state}`}
    >
      <defs>
        <style>{STYLES}</style>
      </defs>

      <g className={state === 'idle' ? 'bb-bob' : ''}>

        {/* Bras (done) — derrière le document */}
        {state === 'done' && <DoneArms />}

        {/* Corps */}
        <Body />

        {/* Serre-tête — derrière la tête */}
        {hasCans && <HeadbandBack />}

        {/* Tête */}
        <Head pupilDY={pupilDY} bigSmile={bigSmile} />

        {/* Oreillettes — devant la tête */}
        {hasCans && <EarCups listening={state === 'listening'} />}

        {/* Accessoires selon l'état */}
        {state === 'listening' && <SoundWaves />}
        {state === 'writing'   && <Writing />}
        {state === 'done'      && <DoneDocument />}

      </g>
    </svg>
  )
}
