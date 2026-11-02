import { ArrowRight, Compass, Globe2, Lightbulb, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import aboutImage from '../assets/ones2.avif'
import teamImage from '../assets/team.png'

function About() {
  return (
    <>
      <section className="page-intro about-intro">
        <div className="container">
          <div className="breadcrumb"><span>Explore</span><span>/</span><strong>About us</strong></div>
          <span className="eyebrow">A little closer to the sky</span>
          <h1>Aerospace is for <span>all of us.</span></h1>
          <p>We’re here to make the science and opportunities of aerospace easier to discover, understand, and imagine yourself in.</p>
        </div>
      </section>
      <section className="section about-story">
        <div className="container about-story-grid">
          <div className="about-story-copy">
            <span className="eyebrow">Our purpose</span>
            <h2>Making the extraordinary feel within reach.</h2>
            <p>
              Aerospace can seem like a world reserved for experts. AeroCampus brings the
              ideas back to earth: clear explanations, thoughtful stories, and practical
              career guidance for learners at every stage.
            </p>
            <p>
              We’re building an inviting starting point for young people, educators, and
              anyone who has ever looked up and wondered how it all works.
            </p>
            <Link className="text-link" to="/articles">Explore what we’re learning <ArrowRight size={16} /></Link>
          </div>
          <div className="about-story-image">
            <img
              src={aboutImage}
              alt="Students collaborating on a learning project"
              loading="lazy"
            />
            <span className="about-image-caption">The next generation is already looking up.</span>
          </div>
        </div>
      </section>
      <section className="section values-section">
        <div className="container">
          <div className="section-heading">
            <div><span className="eyebrow">What guides us</span><h2>Curiosity is a powerful thing.</h2></div>
          </div>
          <div className="values-grid">
            <article className="value-card"><span><Lightbulb size={21} /></span><h3>Make it understandable</h3><p>We break big ideas into clear, engaging learning—without losing the wonder.</p></article>
            <article className="value-card"><span><Globe2 size={21} /></span><h3>Keep doors open</h3><p>Aerospace needs different skills and perspectives. We help more people see a place for themselves.</p></article>
            <article className="value-card"><span><Target size={21} /></span><h3>Connect learning to life</h3><p>Real-world stories and pathways show how classroom ideas can travel far.</p></article>
          </div>
        </div>
      </section>
      <section className="section team-section">
        <div className="container">
          <div className="section-heading team-heading">
            <div>
              <span className="eyebrow">The people behind AeroCampus</span>
              <h2>Meet the AeroCampus team.</h2>
            </div>
            <p>Curious people working together to make aerospace learning more welcoming and accessible.</p>
          </div>
          <article className="team-card">
            <img src={teamImage} alt="The AeroCampus team together" loading="lazy" />
            <div className="team-card-copy">
              <span className="eyebrow">Our team</span>
              <h3>AeroCampus Team</h3>
              <p>Our team members bring different ideas, skills, and perspectives to every story we share.</p>
              <div className="team-member-list" aria-label="AeroCampus team members">
                <span>Team members</span>
                <ul>
                  <li>Alex Morgan</li>
                  <li>Jordan Lee</li>
                  <li>Taylor Smith</li>
                  <li>Samira Ahmed</li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>
      <section className="about-cta">
        <div className="container about-cta-inner">
          <div className="about-cta-icon"><Compass size={24} /></div>
          <div><span className="eyebrow">Your journey starts anywhere</span><h2>Let’s explore what’s possible.</h2></div>
          <Link className="button button-light" to="/aerospace-engineering#career-opportunities">Explore careers <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  )
}

export default About
