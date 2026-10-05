import { categoryService } from "@/services/category.service";

export default async function Page({ params }: { params: { lang: string; slug: string } }) {
    const { lang, slug } = params;
    const category = await categoryService.getAllWithPosts(slug);
    console.log(category);
    return (
        <div>
            <h1>hello</h1>
            {category.map((item) => (
                <div key={item.termTaxonomyId}>
                    <h1>{item.description}</h1>
                </div>
            ))}
        </div>
    );
}