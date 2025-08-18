import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const colors = ['--neon-purple', '--neon-blue', '--neon-cyan', '--cyber-purple', '--electric-blue'];
      
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 20,
          duration: 20 + Math.random() * 10,
          size: 1 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full opacity-70"
          style={{
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `hsl(var(${particle.color}))`,
            boxShadow: `0 0 ${particle.size * 5}px hsl(var(${particle.color}))`,
            animation: `particle-float ${particle.duration}s linear infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gaming-darker/20 to-gaming-darker/60" />
    </div>
  );
};

export default ParticleBackground;