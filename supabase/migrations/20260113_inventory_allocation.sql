-- Link Inventory to Requisitions for Customer Allocation
ALTER TABLE public.vehicle_inventory 
ADD COLUMN allocated_to_requisition_id UUID REFERENCES public.purchase_requisitions(id);

COMMENT ON COLUMN public.vehicle_inventory.allocated_to_requisition_id IS 'Link to the requisition that booked this specific unit';
