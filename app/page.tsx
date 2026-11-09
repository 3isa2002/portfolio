import { BootIntro } from "@/components/intro/BootIntro";
import { IntroScript } from "@/components/intro/IntroScript";
import { SectionIndex } from "@/components/layout/SectionIndex";
import { JsonLd, personSchema } from "@/components/seo/JsonLd";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { t } from "@/lib/i18n";

/** Section ids in story order; the right-edge index follows them. */
const indexItems = [
  { id: "hero", label: t.sectionIndex.hero },
  { id: "about", label: t.sections.about.label },
  { id: "projects", label: t.sections.projects.label },
  { id: "skills", label: t.sections.skills.label },
  { id: "experience", label: t.sections.experience.label },
  { id: "contact", label: t.sections.contact.label },
];

/** Home: the six sections in story order (SPEC §5). */
export default function Home() {
  return (
    <>
      {/* Runs before first paint: picks the intro mode (full / short / calm). */}
      <IntroScript />
      <BootIntro />
      <Hero />
      <About />
      <Projects />
      <Skills />
      <Experience />
      <Contact />
      <SectionIndex items={indexItems} />
      <JsonLd data={personSchema()} />
    </>
  );
}
