import { useAuth0 } from "@auth0/auth0-react";

function Home() {
  const { loginWithRedirect } = useAuth0();
  return (
    <div className="h-screen w-full bg-neutral-50 flex flex-col md:flex-row">
      <div className="md:w-1/2 p-4 flex flex-col justify-center items-center">
        <h1 className="text-5xl font-extrabold">
          Nausicca&apos;s <span className="text-green-400">Green</span>
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-center">
          A small business is as good as its tools.
        </h2>
        <p className="pt-6 md:w-[70%] text-center">
          Empowering positive change by connecting grantors with impactful
          projects. At Nausicca, we believe in making a difference. Explore and
          support projects that align with your values and create a lasting
          impact on communities around the world.
        </p>
        <button
          className="mt-10 h-12 w-full md:w-32 rounded-lg bg-green-300 text-green-700 hover:bg-green-500 hover:text-white"
          type="submit"
          onClick={() => loginWithRedirect()}
        >
          Sign Up
        </button>
        <img
          className="h-auto cursor-pointer bg-clip-border hover:drop-shadow-2xl mt-8 md:hidden"
          src="https://res.cloudinary.com/dvq989hma/image/upload/v1711330889/134274_iekfud.jpg"
          alt="plant2"
        />
      </div>
      <div className="md:w-1/2 flex flex-col justify-center">
        <div className="m-4 h-auto rounded-xl bg-green-300 p-4 bg-clip-border hover:drop-shadow-2xl cursor-pointer">
          <h1 className="font-extrabold">Unlock Funding Opportunities</h1>
          <p>
            Explore a range of grant options tailored specifically for climate
            change projects, including the prestigious Teto grant offering up to
            €10,000 in funds.
          </p>
        </div>
        <div className="m-4 h-auto rounded-xl bg-green-300 p-4 bg-clip-border hover:drop-shadow-2xl cursor-pointer">
          <h1 className="font-extrabold">Seamless Application Process</h1>
          <p>
            Our user-friendly platform ensures a smooth and systematic
            application process, collecting essential details to match you with
            the perfect grant for your project.
          </p>
        </div>
        <div className="m-4 h-auto rounded-xl bg-green-300 p-4 bg-clip-border hover:drop-shadow-2xl cursor-pointer">
          <h1 className="font-extrabold">Join Us in Making a Difference</h1>
          <p>
            Start your journey towards positive environmental impact today.
            Apply for grants, connect with like-minded individuals, and be part
            of the solution with Nausicca Green.
          </p>
        </div>
      </div>
      <img
        className="hidden md:block w-1/2 h-auto bg-clip-border hover:drop-shadow-2xl"
        src="https://res.cloudinary.com/dvq989hma/image/upload/v1711330889/134274_iekfud.jpg"
        alt="plant2"
      />
    </div>
  );
}

export default Home;
