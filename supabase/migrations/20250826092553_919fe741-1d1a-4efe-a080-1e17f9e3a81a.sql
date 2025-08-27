-- Insert placeholder laws with various categories and severity levels
INSERT INTO public.laws (title, description, category, fine_amount, jail_time_minutes, severity_level, order_index, is_active) VALUES
-- Traffic Violations
('Speeding', 'Exceeding the posted speed limit by more than 15 mph in city limits or highways.', 'Traffic Violations', 250, 0, 'Minor', 1, true),
('Reckless Driving', 'Operating a vehicle in a manner that shows willful disregard for safety of persons or property.', 'Traffic Violations', 750, 15, 'Moderate', 2, true),
('Street Racing', 'Participating in organized or impromptu racing events on public roads.', 'Traffic Violations', 2500, 45, 'Severe', 3, true),
('Hit and Run', 'Leaving the scene of an accident without providing information or rendering aid.', 'Traffic Violations', 5000, 60, 'Severe', 4, true),

-- Property Crimes
('Trespassing', 'Unlawfully entering or remaining on private property without permission.', 'Property Crimes', 500, 10, 'Minor', 5, true),
('Vandalism', 'Intentionally damaging or defacing public or private property.', 'Property Crimes', 1000, 20, 'Moderate', 6, true),
('Burglary', 'Unlawfully entering a building with intent to commit theft or other felony.', 'Property Crimes', 7500, 120, 'Severe', 7, true),
('Grand Theft Auto', 'Unlawfully taking a motor vehicle with intent to permanently deprive the owner.', 'Property Crimes', 10000, 180, 'Severe', 8, true),

-- Violent Crimes
('Assault', 'Intentionally causing bodily harm to another person or threatening imminent harm.', 'Violent Crimes', 2000, 30, 'Moderate', 9, true),
('Battery', 'Unlawfully using force or violence against another person resulting in physical harm.', 'Violent Crimes', 3500, 60, 'Severe', 10, true),
('Armed Robbery', 'Taking property from another person by force or threat while armed with a weapon.', 'Violent Crimes', 15000, 300, 'Severe', 11, true),
('Kidnapping', 'Unlawfully restraining, abducting, or moving another person against their will.', 'Violent Crimes', 25000, 480, 'Severe', 12, true),

-- Drug Offenses
('Possession of Controlled Substance', 'Having illegal drugs in one''s possession for personal use.', 'Drug Offenses', 1500, 25, 'Moderate', 13, true),
('Drug Distribution', 'Selling, delivering, or distributing controlled substances to others.', 'Drug Offenses', 8000, 150, 'Severe', 14, true),
('Manufacturing Drugs', 'Producing, cultivating, or manufacturing illegal controlled substances.', 'Drug Offenses', 20000, 360, 'Severe', 15, true),

-- Public Order
('Disorderly Conduct', 'Engaging in behavior that disturbs the peace or creates public inconvenience.', 'Public Order', 300, 5, 'Minor', 16, true),
('Public Intoxication', 'Being visibly drunk or under the influence of drugs in a public place.', 'Public Order', 400, 10, 'Minor', 17, true),
('Loitering', 'Remaining in a public place without apparent purpose after being asked to leave.', 'Public Order', 200, 0, 'Minor', 18, true),
('Disturbing the Peace', 'Making excessive noise or engaging in disruptive behavior that affects others.', 'Public Order', 500, 15, 'Minor', 19, true),

-- Weapons Violations
('Carrying Concealed Weapon', 'Possessing a concealed firearm without proper licensing or permits.', 'Weapons Violations', 3000, 45, 'Moderate', 20, true),
('Brandishing a Weapon', 'Displaying or threatening with a weapon in a menacing manner.', 'Weapons Violations', 5000, 90, 'Severe', 21, true),
('Illegal Firearm Possession', 'Possessing firearms that are not registered or are prohibited.', 'Weapons Violations', 7500, 120, 'Severe', 22, true),

-- Financial Crimes
('Fraud', 'Intentionally deceiving another person to secure unfair or unlawful gain.', 'Financial Crimes', 5000, 60, 'Moderate', 23, true),
('Embezzlement', 'Misappropriating funds or property entrusted to one''s care.', 'Financial Crimes', 10000, 180, 'Severe', 24, true),
('Money Laundering', 'Concealing the origins of illegally obtained money through legitimate channels.', 'Financial Crimes', 25000, 300, 'Severe', 25, true);