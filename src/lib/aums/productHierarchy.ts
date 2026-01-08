import { ProductVariant } from "@/types/productMaster";

export interface HierarchyNode {
    name: string;
    children: Map<string, HierarchyNode>; // Child Name -> Node
    variants: ProductVariant[]; // Leaf nodes (actual SKUs under this level)
}

export function buildHierarchy(products: ProductVariant[]): Map<string, HierarchyNode> {
    const brands = new Map<string, HierarchyNode>();

    products.forEach(p => {
        // Level 1: Brand
        if (!brands.has(p.make)) {
            brands.set(p.make, { name: p.make, children: new Map(), variants: [] });
        }
        const brandNode = brands.get(p.make)!;

        // Level 2: Model
        if (!brandNode.children.has(p.model)) {
            brandNode.children.set(p.model, { name: p.model, children: new Map(), variants: [] });
        }
        const modelNode = brandNode.children.get(p.model)!;

        // Level 3: Variant Group
        if (!modelNode.children.has(p.variant)) {
            modelNode.children.set(p.variant, { name: p.variant, children: new Map(), variants: [] });
        }
        const variantNode = modelNode.children.get(p.variant)!;

        // Level 4: Leaf (The SKU itself - e.g. Color/Size specific)
        variantNode.variants.push(p);
    });

    return brands;
}
