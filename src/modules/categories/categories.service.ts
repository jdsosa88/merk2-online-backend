import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const existingCategory = await this.categoryModel.findOne({
        name: createCategoryDto.name
      });

      if (existingCategory) {
        throw new ConflictException(`Category with name "${createCategoryDto.name}" already exists`);
      }

      let parents: Types.ObjectId[] = [];
      let level = 0;
      let isRoot = true;
      let directParentId: Types.ObjectId | null = null;


      if (createCategoryDto.parent) {
        const _id = new Types.ObjectId(createCategoryDto.parent);
        // Validar que el padre directo exista
        const directParent = await this.categoryModel.findById(_id);
        if (!directParent) {
          throw new BadRequestException('Parent category does not exist');
        }

        parents = [...directParent.parents, directParent._id];

        // Eliminar duplicados manteniendo el orden
        parents = parents.filter((id, index, self) =>
          index === self.findIndex((t) => t.equals(id))
        );

        directParentId = directParent._id;
        level = directParent.level + 1;
        isRoot = false;
      }


      let subcategories: Types.ObjectId[] = [];
      const objectIdSubcategories = createCategoryDto.subcategories
        ? createCategoryDto.subcategories.map(id => new Types.ObjectId(id))
        : [];

      if (objectIdSubcategories.length > 0) {
        const subcategoryDocs = await this.categoryModel.find({
          _id: { $in: objectIdSubcategories }
        });

        if (subcategoryDocs.length !== objectIdSubcategories.length) {
          throw new BadRequestException('One or more subcategories do not exist');
        }

        subcategories = objectIdSubcategories;
      }

      // Crear la categoría sin subcategorías
      const newCategory = new this.categoryModel({
        ...createCategoryDto,
        parents,
        subcategories: [],
        level: createCategoryDto.level ?? level,
        isRoot: createCategoryDto.isRoot ?? isRoot,
      });

      const savedCategory = await newCategory.save();

      // Agregar la nueva categoría como subcategoría del PADRE DIRECTO
      if (directParentId) {
        await this.categoryModel.findByIdAndUpdate(
          directParentId,
          { $addToSet: { subcategories: savedCategory._id } }
        );
      }

      // Ahora actualizar las subcategorías (si existen) con el ID de la nueva categoría
      if (objectIdSubcategories.length > 0) {
        // Para cada subcategoría, establecer los padres correctos
        const updatedParents = [...parents, savedCategory._id];

        await Promise.all(objectIdSubcategories.map(async (subcatId) => {
          await this.categoryModel.findByIdAndUpdate(
            subcatId,
            {
              $set: {
                parents: updatedParents,
                level: savedCategory.level + 1,
                isRoot: false
              }
            }
          );

          // Agregar la subcategoría a la categoría actual
          await this.categoryModel.findByIdAndUpdate(
            savedCategory._id,
            { $addToSet: { subcategories: subcatId } }
          );
        }));
      }

      return savedCategory;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating category');
    }
  }

  async findAll(includeInactive: boolean = false): Promise<Category[]> {
    const query = includeInactive ? {} : { isActive: true };

    return this.categoryModel.find(query)
      .sort({ level: 1, name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Category> {
    const _id = new Types.ObjectId(id);
    const category = await this.categoryModel.findById(_id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findCategoryWithHierarchy(id: string): Promise<any> {
    const _id = new Types.ObjectId(id);
    const category = await this.categoryModel.findById(_id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const allSubcategories = await this.getAllSubcategoriesRecursive(category._id);

    const allParents = await this.getParentsWithDetails(category.parents);

    return {
      ...category.toObject(),
      subcategories: allSubcategories,
      parents: allParents,
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const _id = new Types.ObjectId(id);
    const category = await this.categoryModel.findById(_id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const previousIsActive = category.isActive;

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        _id: { $ne: id }
      });

      if (existingCategory) {
        throw new ConflictException(`Category with name "${updateCategoryDto.name}" already exists`);
      }
    }

    if (updateCategoryDto.isActive === true) {
      const inactiveParent = await this.categoryModel.findOne({
        _id: { $in: category.parents },
        isActive: false
      });

      if (inactiveParent) {
        throw new BadRequestException(
          `Cannot activate category because parent category "${inactiveParent.name}" is inactive`
        );
      }
    }

    if (updateCategoryDto.name) category.name = updateCategoryDto.name;
    if (updateCategoryDto.description !== undefined) category.description = updateCategoryDto.description;
    if (updateCategoryDto.icon !== undefined) category.icon = updateCategoryDto.icon;
    if (updateCategoryDto.color !== undefined) category.color = updateCategoryDto.color;

    if (updateCategoryDto.isActive !== undefined) {
      category.isActive = updateCategoryDto.isActive;

      if (previousIsActive === true && updateCategoryDto.isActive === false) {
        await this.deactivateDescendants(category._id);
      }
    }

    if (updateCategoryDto.subcategories !== undefined) {
      const oldSubcategories = [...category.subcategories];
      const newSubcategories = updateCategoryDto.subcategories.map(id => new Types.ObjectId(id));

      const subcategoryDocs = await this.categoryModel.find({
        _id: { $in: newSubcategories }
      });

      if (subcategoryDocs.length !== newSubcategories.length) {
        throw new BadRequestException('One or more subcategories do not exist');
      }

      category.subcategories = newSubcategories;

      await this.updateSubcategoryRelations(oldSubcategories, newSubcategories, category._id);
    }

    return category.save();
  }

  async remove(id: string): Promise<Category> {
    const _id = new Types.ObjectId(id);
    const deletedCategory = await this.deleteCategoryWithSubcategories(_id, true);
    if (!deletedCategory) throw new NotFoundException(`Category not found`);
    return deletedCategory;
  }

  async getRootCategories(): Promise<Category[]> {
    return this.categoryModel.find({ isRoot: true, isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async getCategoryTree(rootId?: string): Promise<any> {
    if (rootId) {
      const _id = new Types.ObjectId(rootId);
      const rootCategory = await this.categoryModel.findById(_id);
      if (!rootCategory) {
        throw new NotFoundException(`Root category with ID ${rootId} not found`);
      }
      return this.buildCategoryTree(rootCategory);
    }

    const rootCategories = await this.categoryModel.find({ isRoot: true, isActive: true });
    const trees = await Promise.all(
      rootCategories.map(root => this.buildCategoryTree(root))
    );

    return trees;
  }

  async existAllCategories(categories: string[]): Promise<boolean> {
    const categoryIds = categories.map(category => new Types.ObjectId(category));
    try {
      const categories = await this.categoryModel.find({
        _id: { $in: categoryIds }
      });
      return categories.length === categoryIds.length;
    } catch (error) {
      return false;
    }
  }

  private async getAllSubcategoriesRecursive(categoryId: Types.ObjectId): Promise<any[]> {
    const category = await this.categoryModel.findById(categoryId);
    if (!category || category.subcategories.length === 0) {
      return [];
    }

    const subcategories = await this.categoryModel.find({
      _id: { $in: category.subcategories }
    });

    const result = await Promise.all(
      subcategories.map(async (subcat) => {
        const children = await this.getAllSubcategoriesRecursive(subcat._id);
        return {
          _id: subcat._id,
          name: subcat.name,
          level: subcat.level,
          isActive: subcat.isActive,
          subcategories: children,
        };
      })
    );

    return result;
  }

  private async getParentsWithDetails(parentIds: Types.ObjectId[]): Promise<any[]> {
    if (parentIds.length === 0) {
      return [];
    }

    const parents = await this.categoryModel.find({
      _id: { $in: parentIds }
    }).sort({ level: 1 }); // Ordenar por nivel ascendente

    return parents.map(parent => ({
      _id: parent._id,
      name: parent.name,
      level: parent.level,
      isRoot: parent.isRoot,
    }));
  }

  private async updateSubcategoryRelations(
    oldSubcategories: Types.ObjectId[],
    newSubcategories: Types.ObjectId[],
    categoryId: Types.ObjectId
  ): Promise<void> {
    // Remover de las subcategorías que ya no están
    const removedSubcategories = oldSubcategories.filter(
      id => !newSubcategories.some(newId => newId.equals(id))
    );

    if (removedSubcategories.length > 0) {
      await this.categoryModel.updateMany(
        { _id: { $in: removedSubcategories } },
        {
          $pull: { parents: categoryId },
          $set: {
            level: { $subtract: ['$level', 1] },
            isRoot: { $cond: [{ $eq: ['$parents', []] }, true, false] }
          }
        }
      );
    }

    const addedSubcategories = newSubcategories.filter(
      id => !oldSubcategories.some(oldId => oldId.equals(id))
    );

    if (addedSubcategories.length > 0) {
      const category = await this.categoryModel.findById(categoryId);
      if (!category) throw new BadRequestException("Category not found");
      const allParents = [...category.parents, categoryId];

      await this.categoryModel.updateMany(
        { _id: { $in: addedSubcategories } },
        {
          $addToSet: { parents: { $each: allParents } },
          $set: {
            level: category.level + 1,
            isRoot: false
          }
        }
      );
    }
  }

  private async buildCategoryTree(category: CategoryDocument): Promise<any> {
    const subcategories = await Promise.all(
      category.subcategories.map(async (subcatId) => {
        const subcategory = await this.categoryModel.findById(subcatId);
        if (!subcategory) return null;
        return await this.buildCategoryTree(subcategory);
      })
    );

    return {
      _id: category._id,
      name: category.name,
      level: category.level,
      isRoot: category.isRoot,
      isActive: category.isActive,
      description: category.description,
      icon: category.icon,
      color: category.color,
      subcategories: subcategories.filter(Boolean),
    };
  }

  private async deactivateDescendants(categoryId: Types.ObjectId): Promise<void> {
    const category = await this.categoryModel.findById(categoryId);
    if (!category) return;

    if (category.subcategories && category.subcategories.length > 0) {
      await this.categoryModel.updateMany(
        { _id: { $in: category.subcategories } },
        { $set: { isActive: false } }
      );

      for (const subcatId of category.subcategories) {
        await this.deactivateDescendants(subcatId);
      }
    }
  }

  private async deleteCategoryWithSubcategories(
    categoryId: Types.ObjectId,
    isDeleteCategory: boolean = false
  ): Promise<Category | null> {
    const category = await this.categoryModel.findById(categoryId);
    if (category !== null) {
      if (category.subcategories.length > 0) {
        for (const subcategoryId of category.subcategories) {
          await this.deleteCategoryWithSubcategories(subcategoryId);
        }
      }

      if (isDeleteCategory && category.parents.length > 0) {
        await this.categoryModel.updateMany(
          { _id: { $in: category.parents } },
          { $pull: { subcategories: category._id } }
        );
      }
      const deletedCategory = await this.categoryModel.findByIdAndDelete(categoryId);
      if (isDeleteCategory && !deletedCategory) throw new BadRequestException("Category not found");
      return deletedCategory;
    }
    if (isDeleteCategory) throw new NotFoundException(`Category with ID ${categoryId} not found`);
    return null;
  }
}