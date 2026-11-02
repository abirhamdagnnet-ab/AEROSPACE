import { useEffect } from 'react'
import {
  Activity,
  Atom,
  BrainCircuit,
  Check,
  Code2,
  Cpu,
  DraftingCompass,
  Gauge,
  Globe2,
  Lightbulb,
  Orbit,
  Plane,
  Rocket,
  Satellite,
  ShieldCheck,
  Wind,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import aerospaceImage from '../assets/aerospace1.png'
import './aerospace-engineering.css'

const engineeringWork = [
  {
    icon: DraftingCompass,
    title: 'Design aircraft and spacecraft',
    text: 'Plan the shape, layout, and connected systems of an aircraft, satellite, rocket, or spacecraft.',
  },
  {
    icon: Activity,
    title: 'Understand how they perform',
    text: 'Study aerodynamics (how air moves around a vehicle), propulsion (how engines create thrust), flight mechanics (how a vehicle moves and responds to steering), and the structures that carry its loads.',
  },
  {
    icon: Cpu,
    title: 'Build smart onboard systems',
    text: 'Develop avionics (the electronic systems on a vehicle), navigation, and flight controls that help it sense and respond.',
  },
  {
    icon: Gauge,
    title: 'Test and improve designs',
    text: 'Test prototypes, use simulations, and examine results to see whether a design performs as expected.',
  },
  {
    icon: ShieldCheck,
    title: 'Make flight safer and more efficient',
    text: 'Help vehicles become safer, more reliable, use less energy, and reduce their impact on the environment.',
  },
]

const subjects = [
  {
    icon: Atom,
    title: 'Mathematics and calculus',
    text: 'Describe changing motion, calculate forces, and model how a design may behave.',
  },
  {
    icon: Activity,
    title: 'Physics and mechanics',
    text: 'Explain forces, energy, movement, and the way objects respond to loads.',
  },
  {
    icon: Code2,
    title: 'Programming and numerical methods',
    text: 'Write software and use computer calculations to model complex engineering problems.',
  },
  {
    icon: Wind,
    title: 'Fluid mechanics and aerodynamics',
    text: 'Understand how air and other fluids move around wings, engines, and vehicles.',
  },
  {
    icon: Rocket,
    title: 'Thermodynamics and propulsion',
    text: 'Study heat, energy, and how engines produce the thrust that moves a vehicle.',
  },
  {
    icon: Wrench,
    title: 'Materials and structural analysis',
    text: 'Choose materials and check that structures can withstand forces, vibration, and heat.',
  },
  {
    icon: BrainCircuit,
    title: 'Control systems and electronics',
    text: 'Connect sensors and electronics so vehicles can measure conditions and respond steadily.',
  },
]

const careers = [
  {
    icon: DraftingCompass,
    title: 'Aerospace design engineer',
    text: 'Develop and refine aircraft, spacecraft, components, or the systems inside them.',
  },
  {
    icon: Wind,
    title: 'Aerodynamics engineer',
    text: 'Study airflow to improve lift, reduce drag, and understand how a vehicle behaves.',
  },
  {
    icon: Rocket,
    title: 'Propulsion engineer',
    text: 'Work on engines and propulsion systems that move aircraft or spacecraft.',
  },
  {
    icon: Cpu,
    title: 'Avionics and control systems engineer',
    text: 'Develop the electronics, sensors, navigation, and controls used in flight.',
  },
  {
    icon: Satellite,
    title: 'Satellite and spacecraft systems engineer',
    text: 'Bring together the power, communications, structure, and other systems for space missions.',
  },
  {
    icon: Gauge,
    title: 'Research and simulation engineer',
    text: 'Use experiments, data, and computer models to explore and evaluate new designs.',
  },
]

const skills = [
  'Mathematics and analytical thinking',
  'Physics and engineering fundamentals',
  'Problem-solving and creativity',
  'Computer-aided design (CAD) and simulation',
  'Programming and data analysis',
  'Teamwork and technical communication',
  'Attention to detail and a commitment to safety',
  'Curiosity and continuous learning',
]

function AerospaceEngineering() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'What Is Aerospace Engineering? | AeroCampus'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <>
      <section className="aero-page-intro">
        <div className="container aero-page-intro-grid">
          <div className="aero-page-intro-copy">
            <div className="breadcrumb"><span>Explore</span><span>/</span><strong>Aerospace engineering</strong></div>
            <span className="eyebrow">A beginner’s guide</span>
            <h1>||<span>Aerospace Engineering?</span></h1>
            <p>
              Aerospace engineering is the branch of engineering concerned with designing,
              developing, testing, and improving aircraft, spacecraft, and their related
              systems. It combines mathematics, physics, materials science, computing, and
              engineering principles to solve challenges involving flight and space exploration.
            </p>
          </div>
          <div className="aero-page-intro-image">
            <img
              src={aerospaceImage}
              alt="Aerospace engineering illustration showing a spacecraft and flight-inspired engineering design"
            />
            <div className="aero-page-image-caption"><Globe2 size={16} /> FROM FLIGHT TO SPACE EXPLORATION</div>
          </div>
        </div>
      </section>

      <section className="section aero-work-section" id="what-engineers-do">
        <div className="container">
          <div className="aero-section-heading">
            <div>
              <span className="eyebrow">01 / The work</span>
              <h2>What do aerospace engineers do?</h2>
              <p>
                Their work can span an entire vehicle—from its outer shape to the equipment
                that guides it. They often collaborate with specialists in other fields.
              </p>
            </div>
            <span className="aero-section-emblem" aria-hidden="true"><Orbit size={25} /></span>
          </div>
          <div className="aero-work-grid">
            {engineeringWork.map(({ icon: Icon, title, text }) => (
              <article className="aero-info-card" key={title}>
                <span className="aero-card-icon"><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section aero-branches-section" id="engineering-branches">
        <div className="container">
          <div className="aero-section-heading">
            <div>
              <span className="eyebrow">02 / Two branches</span>
              <h2>One field, two environments.</h2>
              <p>
                Both branches solve problems of flight, but the environment changes the
                engineering challenges and the vehicles they work on.
              </p>
            </div>
          </div>
          <div className="aero-branch-grid">
            <article className="aero-branch-card aero-branch-air">
              <span className="aero-branch-icon"><Plane size={24} /></span>
              <span className="aero-card-label">WITHIN THE ATMOSPHERE</span>
              <h3>Aeronautical engineering</h3>
              <p>
                Focuses on aircraft and flight within Earth’s atmosphere. Engineers consider
                how air flows around a vehicle, how its engines perform, and how it handles
                during flight.
              </p>
              <div className="aero-example"><strong>Examples</strong><span>Passenger aircraft · Helicopters · Uncrewed aircraft</span></div>
            </article>
            <article className="aero-branch-card aero-branch-space">
              <span className="aero-branch-icon"><Satellite size={24} /></span>
              <span className="aero-card-label">BEYOND THE ATMOSPHERE</span>
              <h3>Astronautical engineering</h3>
              <p>
                Focuses on spacecraft, rockets, satellites, and space missions. Designs must
                work in the demanding conditions of space, where there is no air to provide lift.
              </p>
              <div className="aero-example"><strong>Examples</strong><span>Launch vehicles · Earth-observing satellites · Space probes</span></div>
            </article>
          </div>
        </div>
      </section>

      <section className="section aero-subjects-section" id="subjects">
        <div className="container">
          <div className="aero-section-heading">
            <div>
              <span className="eyebrow">03 / What you’ll study</span>
              <h2>Build knowledge one subject at a time.</h2>
              <p>
                These subjects help engineers understand how vehicles move, what they are
                made of, and how their systems work together.
              </p>
            </div>
          </div>
          <div className="aero-subject-grid">
            {subjects.map(({ icon: Icon, title, text }) => (
              <article className="aero-subject-card" key={title}>
                <span className="aero-card-icon"><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="aero-note">
            <Lightbulb size={18} />
            Exact admission requirements and course content vary by university and country.
            Check the guidance published by the institutions you are interested in.
          </p>
        </div>
      </section>

      <section className="section aero-careers-section" id="career-opportunities">
        <div className="container">
          <div className="aero-section-heading">
            <div>
              <span className="eyebrow">04 / Where it can lead</span>
              <h2>Explore aerospace career paths.</h2>
              <p>
                Aerospace teams need many different kinds of expertise. These are a few
                examples of roles across the industry and research.
              </p>
            </div>
          </div>
          <div className="aero-career-grid">
            {careers.map(({ icon: Icon, title, text }) => (
              <article className="aero-career-card" key={title}>
                <span className="aero-card-icon"><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="aero-qualification-note">
            Aircraft maintenance and other aviation engineering roles are also important
            career options. Depending on the role and location, they may require specialized
            training, certification, or additional qualifications. Requirements vary.
          </p>
        </div>
      </section>

      <section className="section aero-skills-section" id="skills">
        <div className="container aero-skills-layout">
          <div className="aero-skills-copy">
            <span className="eyebrow">05 / Skills to grow</span>
            <h2>There’s room to learn as you go.</h2>
            <p>
              Aerospace engineers build a blend of technical and people skills over time.
              You do not need to arrive as an expert—curiosity and practice are good places
              to start.
            </p>
            <Link className="button button-primary" to="/articles">
              Explore aerospace stories <Orbit size={17} />
            </Link>
          </div>
          <ul className="aero-skills-list">
            {skills.map((skill) => (
              <li key={skill}><span><Check size={15} /></span>{skill}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

export default AerospaceEngineering
