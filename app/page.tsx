import { Nav } from "@/components/ui/Nav";
import { MotionController } from "@/components/ui/MotionController";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { World } from "@/components/sections/World";
import { Defenders } from "@/components/sections/Defenders";
import { Energy } from "@/components/sections/Energy";
import { Ferrosomas } from "@/components/sections/Ferrosomas";
import { Story } from "@/components/sections/Story";
import { Characters } from "@/components/sections/Characters";
import { Archive } from "@/components/sections/Archive";
import { Transmedia } from "@/components/sections/Transmedia";
import { Roadmap } from "@/components/sections/Roadmap";
import { Manifesto } from "@/components/sections/Manifesto";
import { Follow } from "@/components/sections/Follow";
import { Partnerships } from "@/components/sections/Partnerships";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <div className="grain" aria-hidden="true" />
      <main id="main">
        <Hero />
        <Statement />
        <World />
        <Defenders />
        <Energy />
        <Ferrosomas />
        <Story />
        <Characters />
        <Archive />
        <Transmedia />
        <Roadmap />
        <Manifesto />
        <Follow />
        <Partnerships />
      </main>
      <Footer />
      <MotionController />
    </>
  );
}
