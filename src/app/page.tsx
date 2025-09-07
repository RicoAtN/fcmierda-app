import Image from "next/image";
import { Roboto_Slab, Montserrat } from "next/font/google";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

export default function Home() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/football-bg.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <main
        className="relative z-10 flex flex-col items-center justify-center text-center px-4"
        style={{ marginTop: "-30vh" }} // Move content higher
      >
        <h2
          className={`text-3xl sm:text-4xl font-semibold text-white drop-shadow-lg mb-2 ${montserrat.className}`}
          style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
        >
          Welcome to
        </h2>
        <h1
          className={`text-6xl sm:text-8xl font-extrabold mb-4 ${robotoSlab.className}`}
          style={{
            letterSpacing: "0.07em",
            textShadow: `
              0 0 8px #116530,   /* soft dark green glow */
              0 0 0 #116530,     /* fallback for browsers */
              0 2px 0 #116530,   /* dark green shadow below */
              0 0 16px #116530,  /* more dark green glow */
              0 6px 32px rgba(0,0,0,0.7), 
              0 1px 0 #fff
            `,
            color: "#fff",
            textTransform: "uppercase",
          }}
        >
          FC Mierda
        </h1>
        <p
          className={`text-xl sm:text-2xl text-white font-medium mb-8 drop-shadow-lg ${montserrat.className}`}
          style={{ maxWidth: 500 }}
        >
          Your favorite below average football team from Rotterdam.
        </p>
        <Image
          src="/FCMierda-team-logo.png"
          alt="FC Mierda Logo"
          width={360}
          height={360}
          className="mb-8"
          style={{ maxWidth: "440px", height: "auto" }}
        />
      </main>
    </div>
  );
}
