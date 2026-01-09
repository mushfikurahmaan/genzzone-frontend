'use client';

export function Hero() {
  const slide = {
    title: 'Welcome to GEN-Z ZONE',
    subtitle: 'Your Premium Shopping Destination',
  };

  return (
    <section className="relative w-full bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Main Banner - Full Width */}
        <div className="relative h-[400px] lg:h-[500px] rounded-lg overflow-hidden bg-gradient-to-br from-pink-50 to-white">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center z-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                {slide.title}
              </h2>
              <div className="inline-block bg-white rounded-full px-6 py-3 shadow-lg mt-4">
                <span className="text-lg font-semibold text-gray-800">
                  {slide.subtitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

