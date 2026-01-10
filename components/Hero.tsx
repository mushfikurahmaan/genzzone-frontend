'use client';

export function Hero() {
  const slide = {
    title: 'Welcome to GEN-Z ZONE',
    subtitle: 'Your Premium Shopping Destination',
  };

  return (
    <section className="relative w-full bg-white overflow-hidden">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* Main Banner - Full Width */}
        <div className="relative h-[500px] md:h-[600px] lg:h-[700px] rounded-lg overflow-hidden bg-black">
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-gray-900"></div>
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-center p-8 md:p-12">
            <div className="text-center z-10 max-w-4xl mx-auto">
              {/* Main Title with split styling */}
              <div className="mb-6 md:mb-8">
                <h1 
                  className="text-4xl md:text-5xl lg:text-7xl font-bold mb-3 md:mb-4 leading-tight"
                  style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                >
                  <span className="text-white block">Welcome to</span>
                  <span className="text-white block">
                    <span className="text-red-600">GEN-Z</span> ZONE
                  </span>
                </h1>
              </div>
              
              {/* Subtitle with elegant styling */}
              <div className="inline-block">
                <p 
                  className="text-base md:text-lg lg:text-xl text-gray-300 font-light tracking-[0.15em] uppercase"
                  style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                >
                  {slide.subtitle}
                </p>
                {/* Decorative underline */}
                <div className="mt-3 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
              </div>
            </div>
          </div>
          
          {/* Subtle corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-red-600/20 to-transparent"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48">
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-red-600/10 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}


