import { ApiContext, Category, CategorySearchResult, GetCategoryParams } from '../../types';
import { deserializeCategories } from '../serializers/category';

const findCategory = (categories: Category[], slug: string) => categories.find(e => e.slug === slug);

export default async function getCategory({ client }: ApiContext, { categorySlug, vendorId }: GetCategoryParams): Promise<CategorySearchResult> {
  const result = await client.taxons.list({filter: {vendor_id: vendorId}, fields: { taxon: 'name,permalink,children,parent,is_root' }, per_page: 500 });
  const rootResult = await client.taxons.show('categories', { fields: { taxon: 'name,permalink,children,parent,is_root' }, per_page: 500 });
  if (result.isSuccess()) {
    try {
      const data = result.success().data;
      const rootResultData = rootResult.success().data;
      if (vendorId) {
        data.forEach((element) => {
          element.relationships.parent.data['id'] = rootResultData.id;
          let children = rootResultData.relationships.children.data;
          if (Array.isArray(children)) {
            children.push({id: element.id, type: 'taxon'});
          } else {
            children = [children, {id: element.id, type: 'taxon'}];
          }
          rootResultData.relationships.children.data = children;

        });
        data.push(rootResultData);
      }
      const categories = deserializeCategories(data);
      return {
        root: findCategory(categories, 'categories'),
        current: findCategory(categories, categorySlug)
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  } else {
    console.log(result.fail());
    throw result.fail();
  }
}
