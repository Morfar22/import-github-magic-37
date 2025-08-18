-- Add DELETE policy for staff on applications table
CREATE POLICY "Staff can delete applications" 
ON public.applications 
FOR DELETE 
USING (is_staff(auth.uid()));