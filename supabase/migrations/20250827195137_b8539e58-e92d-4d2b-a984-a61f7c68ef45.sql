-- Add placeholder laws to the laws table

INSERT INTO public.laws (title, description, fine_amount, jail_time, severity) VALUES
('Speeding', 'Operating a vehicle above the posted speed limit', 150, 0, 'minor'),
('Reckless Driving', 'Driving with willful or wanton disregard for the safety of persons or property', 500, 5, 'moderate'),
('Running Red Light', 'Failing to stop at a red traffic signal', 200, 0, 'minor'),
('Assault', 'Intentionally causing bodily harm to another person', 1000, 15, 'major'),
('Theft', 'Unlawfully taking property belonging to another', 750, 10, 'moderate'),
('Vandalism', 'Intentional destruction of public or private property', 300, 3, 'minor'),
('Drug Possession', 'Unlawful possession of controlled substances', 1500, 20, 'major'),
('Weapon Possession', 'Carrying an unlicensed firearm in public', 2000, 30, 'major'),
('Public Intoxication', 'Being visibly intoxicated in a public place', 100, 2, 'minor'),
('Disorderly Conduct', 'Engaging in violent, tumultuous, or threatening behavior', 250, 5, 'minor'),
('Breaking and Entering', 'Unlawfully entering a building with intent to commit a crime', 1200, 25, 'major'),
('Bank Robbery', 'Armed robbery of a financial institution', 5000, 60, 'felony'),
('Murder', 'Intentionally causing the death of another person', 10000, 120, 'felony'),
('Kidnapping', 'Unlawfully restraining another person against their will', 3000, 45, 'felony'),
('Arson', 'Intentionally setting fire to property', 2500, 40, 'major');