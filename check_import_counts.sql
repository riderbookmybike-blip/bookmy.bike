-- Check import counts per collection
SELECT 
    root_collection, 
    collection_path, 
    COUNT(*) as record_count 
FROM 
    public.firebase_antigravity 
GROUP BY 
    root_collection, collection_path 
ORDER BY 
    record_count DESC;
