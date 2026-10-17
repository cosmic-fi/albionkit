import '../models/albionkit_api_status.dart';
import '../models/animal_models.dart';
import '../models/cooking_models.dart';
import '../models/farming_models.dart';
import '../models/albionkit_models.dart';
import '../models/specialized_profit_models.dart';
import '../services/albion_game_info_api.dart';
import '../services/albionkit_api.dart';
import '../../ui/settings/app_language.dart';

class AlbionKitRepository {
  AlbionKitRepository({
    AlbionKitApiClient? apiClient,
    AlbionGameInfoApi? gameInfoApi,
  }) : _apiClient = apiClient ?? AlbionKitApiClient(),
       _gameInfoApi = gameInfoApi ?? AlbionGameInfoApi();

  final AlbionKitApiClient _apiClient;
  final AlbionGameInfoApi _gameInfoApi;
  final Map<String, Future<Map<String, String>>> _localizedItemNames = {};

  static const alchemyRecipes = [
    AlchemyRecipe(
      id: 'poison-t4',
      name: 'Poison Potion',
      tier: 4,
      ingredients: [
        ToolIngredient(
          itemId: 'T4_BURDOCK',
          name: 'Burdock',
          quantity: 12,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T4_MILK', name: 'Milk', quantity: 12),
      ],
    ),
    AlchemyRecipe(
      id: 'poison-t6',
      name: 'Major Poison Potion',
      tier: 6,
      ingredients: [
        ToolIngredient(
          itemId: 'T6_FOXGLOVE',
          name: 'Foxglove',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T6_MILK', name: 'Milk', quantity: 12),
        ToolIngredient(itemId: 'T6_ALCOHOL', name: 'Alcohol', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'poison-t8',
      name: 'Grandmaster Poison Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_YARROW',
          name: 'Yarrow',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_MILK', name: 'Milk', quantity: 36),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'heal-t4',
      name: 'Healing Potion',
      tier: 4,
      ingredients: [
        ToolIngredient(
          itemId: 'T4_BURDOCK',
          name: 'Burdock',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T3_EGG', name: 'Egg', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'heal-t6',
      name: 'Major Healing Potion',
      tier: 6,
      ingredients: [
        ToolIngredient(
          itemId: 'T6_FOXGLOVE',
          name: 'Foxglove',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T5_EGG', name: 'Egg', quantity: 18),
        ToolIngredient(itemId: 'T6_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'heal-t8',
      name: 'Greater Healing Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_YARROW',
          name: 'Yarrow',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T7_EGG', name: 'Egg', quantity: 18),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'energy-t4',
      name: 'Energy Potion',
      tier: 4,
      ingredients: [
        ToolIngredient(
          itemId: 'T4_BURDOCK',
          name: 'Burdock',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T4_MILK', name: 'Milk', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'energy-t6',
      name: 'Major Energy Potion',
      tier: 6,
      ingredients: [
        ToolIngredient(
          itemId: 'T6_FOXGLOVE',
          name: 'Foxglove',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T6_MILK', name: 'Milk', quantity: 12),
        ToolIngredient(itemId: 'T6_ALCOHOL', name: 'Alcohol', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'energy-t8',
      name: 'Greater Energy Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_YARROW',
          name: 'Yarrow',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_MILK', name: 'Milk', quantity: 36),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'resist-t4',
      name: 'Resistance Potion',
      tier: 4,
      ingredients: [
        ToolIngredient(
          itemId: 'T4_COMFREY',
          name: 'Comfrey',
          quantity: 12,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T4_MILK', name: 'Milk', quantity: 12),
      ],
    ),
    AlchemyRecipe(
      id: 'resist-t6',
      name: 'Major Resistance Potion',
      tier: 6,
      ingredients: [
        ToolIngredient(
          itemId: 'T6_TEASEL',
          name: 'Teasel',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T6_MILK', name: 'Milk', quantity: 12),
        ToolIngredient(itemId: 'T6_ALCOHOL', name: 'Alcohol', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'resist-t8',
      name: 'Greater Resistance Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_MULLEIN',
          name: 'Mullein',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_MILK', name: 'Milk', quantity: 36),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'haste-t4',
      name: 'Haste Potion',
      tier: 4,
      ingredients: [
        ToolIngredient(
          itemId: 'T4_COMFREY',
          name: 'Comfrey',
          quantity: 12,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T4_MILK', name: 'Milk', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'haste-t6',
      name: 'Major Haste Potion',
      tier: 6,
      ingredients: [
        ToolIngredient(
          itemId: 'T6_TEASEL',
          name: 'Teasel',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T6_MILK', name: 'Milk', quantity: 12),
        ToolIngredient(itemId: 'T6_ALCOHOL', name: 'Alcohol', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'haste-t8',
      name: 'Greater Haste Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_MULLEIN',
          name: 'Mullein',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_MILK', name: 'Milk', quantity: 36),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'berserk-t4',
      name: 'Berserk Potion',
      tier: 4,
      ingredients: [
        ToolIngredient(
          itemId: 'T4_COMFREY',
          name: 'Comfrey',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T4_MILK', name: 'Milk', quantity: 12),
      ],
    ),
    AlchemyRecipe(
      id: 'berserk-t6',
      name: 'Major Berserk Potion',
      tier: 6,
      ingredients: [
        ToolIngredient(
          itemId: 'T6_TEASEL',
          name: 'Teasel',
          quantity: 48,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T6_MILK', name: 'Milk', quantity: 12),
        ToolIngredient(itemId: 'T6_ALCOHOL', name: 'Alcohol', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'berserk-t8',
      name: 'Greater Berserk Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_MULLEIN',
          name: 'Mullein',
          quantity: 96,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_MILK', name: 'Milk', quantity: 36),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'cleanse-t4',
      name: 'Cleanse Potion',
      tier: 4,
      ingredients: [
        ToolIngredient(
          itemId: 'T4_COMFREY',
          name: 'Comfrey',
          quantity: 12,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T4_MILK', name: 'Milk', quantity: 12),
      ],
    ),
    AlchemyRecipe(
      id: 'cleanse-t6',
      name: 'Major Cleanse Potion',
      tier: 6,
      ingredients: [
        ToolIngredient(
          itemId: 'T6_TEASEL',
          name: 'Teasel',
          quantity: 24,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T6_MILK', name: 'Milk', quantity: 12),
        ToolIngredient(itemId: 'T6_ALCOHOL', name: 'Alcohol', quantity: 6),
      ],
    ),
    AlchemyRecipe(
      id: 'cleanse-t8',
      name: 'Greater Cleanse Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_MULLEIN',
          name: 'Mullein',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_MILK', name: 'Milk', quantity: 36),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 18),
      ],
    ),
    AlchemyRecipe(
      id: 'focus-restoration',
      name: 'Focus Restoration Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_YARROW',
          name: 'Yarrow',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 36),
      ],
    ),
    AlchemyRecipe(
      id: 'invisibility',
      name: 'Invisibility Potion',
      tier: 8,
      ingredients: [
        ToolIngredient(
          itemId: 'T8_YARROW',
          name: 'Yarrow',
          quantity: 72,
          enchantable: true,
        ),
        ToolIngredient(itemId: 'T8_ALCOHOL', name: 'Alcohol', quantity: 36),
      ],
    ),
  ];

  static const choppedFishProducts = [
    ChoppedFishProduct(
      id: 'T3_FISH_FRESHWATER_ALL_COMMON',
      name: 'Common Freshwater Fish',
      tier: 3,
      yield: 3,
    ),
    ChoppedFishProduct(
      id: 'T3_FISH_SALTWATER_ALL_COMMON',
      name: 'Common Saltwater Fish',
      tier: 3,
      yield: 3,
    ),
    ChoppedFishProduct(
      id: 'T4_FISH_FRESHWATER_ALL_COMMON',
      name: 'Common Freshwater Fish',
      tier: 4,
      yield: 4,
    ),
    ChoppedFishProduct(
      id: 'T4_FISH_SALTWATER_ALL_COMMON',
      name: 'Common Saltwater Fish',
      tier: 4,
      yield: 4,
    ),
    ChoppedFishProduct(
      id: 'T5_FISH_FRESHWATER_ALL_COMMON',
      name: 'Common Freshwater Fish',
      tier: 5,
      yield: 6,
    ),
    ChoppedFishProduct(
      id: 'T5_FISH_SALTWATER_ALL_COMMON',
      name: 'Common Saltwater Fish',
      tier: 5,
      yield: 6,
    ),
    ChoppedFishProduct(
      id: 'T6_FISH_FRESHWATER_ALL_COMMON',
      name: 'Common Freshwater Fish',
      tier: 6,
      yield: 8,
    ),
    ChoppedFishProduct(
      id: 'T6_FISH_SALTWATER_ALL_COMMON',
      name: 'Common Saltwater Fish',
      tier: 6,
      yield: 8,
    ),
    ChoppedFishProduct(
      id: 'T7_FISH_FRESHWATER_ALL_COMMON',
      name: 'Common Freshwater Fish',
      tier: 7,
      yield: 10,
    ),
    ChoppedFishProduct(
      id: 'T7_FISH_SALTWATER_ALL_COMMON',
      name: 'Common Saltwater Fish',
      tier: 7,
      yield: 10,
    ),
    ChoppedFishProduct(
      id: 'T8_FISH_FRESHWATER_ALL_COMMON',
      name: 'Common Freshwater Fish',
      tier: 8,
      yield: 12,
    ),
    ChoppedFishProduct(
      id: 'T8_FISH_SALTWATER_ALL_COMMON',
      name: 'Common Saltwater Fish',
      tier: 8,
      yield: 12,
    ),
    ChoppedFishProduct(
      id: 'T3_FISH_FRESHWATER_SWAMP_RARE',
      name: 'Swamp Rare Fish',
      tier: 3,
      yield: 10,
    ),
    ChoppedFishProduct(
      id: 'T3_FISH_SALTWATER_ALL_RARE',
      name: 'Rare Saltwater Fish',
      tier: 3,
      yield: 10,
    ),
    ChoppedFishProduct(
      id: 'T3_FISH_FRESHWATER_FOREST_RARE',
      name: 'Forest Rare Fish',
      tier: 3,
      yield: 10,
    ),
    ChoppedFishProduct(
      id: 'T5_FISH_SALTWATER_ALL_RARE',
      name: 'Rare Saltwater Fish',
      tier: 5,
      yield: 20,
    ),
    ChoppedFishProduct(
      id: 'T5_FISH_FRESHWATER_FOREST_RARE',
      name: 'Forest Rare Fish',
      tier: 5,
      yield: 20,
    ),
    ChoppedFishProduct(
      id: 'T5_FISH_FRESHWATER_HIGHLANDS_RARE',
      name: 'Highlands Rare Fish',
      tier: 5,
      yield: 20,
    ),
    ChoppedFishProduct(
      id: 'T5_FISH_FRESHWATER_SWAMP_RARE',
      name: 'Swamp Rare Fish',
      tier: 5,
      yield: 20,
    ),
    ChoppedFishProduct(
      id: 'T7_FISH_SALTWATER_ALL_RARE',
      name: 'Rare Saltwater Fish',
      tier: 7,
      yield: 30,
    ),
    ChoppedFishProduct(
      id: 'T7_FISH_FRESHWATER_SWAMP_RARE',
      name: 'Swamp Rare Fish',
      tier: 7,
      yield: 30,
    ),
    ChoppedFishProduct(
      id: 'T7_FISH_FRESHWATER_FOREST_RARE',
      name: 'Forest Rare Fish',
      tier: 7,
      yield: 30,
    ),
    ChoppedFishProduct(
      id: 'T7_FISH_FRESHWATER_HIGHLANDS_RARE',
      name: 'Highlands Rare Fish',
      tier: 7,
      yield: 30,
    ),
    ChoppedFishProduct(
      id: 'T8_FISH_SALTWATER_ALL_BOSS_SHARK',
      name: 'Deadwater Eel',
      tier: 8,
      yield: 40,
    ),
  ];

  static const labourerTypes = [
    LabourerType(
      id: 'blacksmith',
      name: 'Blacksmith',
      journalPrefix: 'WARRIOR',
      category: 'crafting',
      resourceType: 'METALBAR',
    ),
    LabourerType(
      id: 'fletcher',
      name: 'Fletcher',
      journalPrefix: 'HUNTER',
      category: 'crafting',
      resourceType: 'LEATHER',
    ),
    LabourerType(
      id: 'imbuer',
      name: 'Imbuer',
      journalPrefix: 'MAGE',
      category: 'crafting',
      resourceType: 'CLOTH',
    ),
    LabourerType(
      id: 'tinker',
      name: 'Tinker',
      journalPrefix: 'TOOLMAKER',
      category: 'crafting',
      resourceType: 'PLANKS',
    ),
    LabourerType(
      id: 'lumberjack',
      name: 'Lumberjack',
      journalPrefix: 'WOODGATHERER',
      category: 'gathering',
      resourceType: 'WOOD',
    ),
    LabourerType(
      id: 'stonecutter',
      name: 'Stonecutter',
      journalPrefix: 'STONEGATHERER',
      category: 'gathering',
      resourceType: 'STONE',
    ),
    LabourerType(
      id: 'prospector',
      name: 'Prospector',
      journalPrefix: 'OREGATHERER',
      category: 'gathering',
      resourceType: 'ORE',
    ),
    LabourerType(
      id: 'cropper',
      name: 'Cropper',
      journalPrefix: 'FIBERGATHERER',
      category: 'gathering',
      resourceType: 'FIBER',
    ),
    LabourerType(
      id: 'gamekeeper',
      name: 'Gamekeeper',
      journalPrefix: 'HIDEGATHERER',
      category: 'gathering',
      resourceType: 'HIDE',
    ),
    LabourerType(
      id: 'fisherman',
      name: 'Fisherman',
      journalPrefix: 'FISHING',
      category: 'gathering',
    ),
    LabourerType(
      id: 'mercenary',
      name: 'Mercenary',
      journalPrefix: 'MERCENARY',
      category: 'mercenary',
    ),
  ];

  static const animalProducts = [
    AnimalProduct(
      id: 'chicken',
      name: 'Chicken',
      tier: 3,
      type: 'Pasture animal',
      growthHours: 22,
      foodPerCycle: 18,
      offspringReturnRate: 60,
      focusOffspringReturnRate: 140,
      favoriteFoodId: 'T3_FARM_WHEAT',
      babyId: 'T3_FARM_CHICKEN_BABY',
      adultId: 'T3_FARM_CHICKEN_GROWN',
      produceId: 'T3_EGG',
      produceYield: 10,
      meatId: 'T3_MEAT',
      meatYield: 20,
    ),
    AnimalProduct(
      id: 'goat',
      name: 'Goat',
      tier: 4,
      type: 'Pasture animal',
      growthHours: 44,
      foodPerCycle: 18,
      offspringReturnRate: 73.33,
      focusOffspringReturnRate: 126.66,
      favoriteFoodId: 'T4_FARM_TURNIP',
      babyId: 'T4_FARM_GOAT_BABY',
      adultId: 'T4_FARM_GOAT_GROWN',
      produceId: 'T4_MILK',
      produceYield: 10,
      meatId: 'T4_MEAT',
      meatYield: 20,
    ),
    AnimalProduct(
      id: 'goose',
      name: 'Goose',
      tier: 5,
      type: 'Pasture animal',
      growthHours: 66,
      foodPerCycle: 18,
      offspringReturnRate: 80,
      focusOffspringReturnRate: 120,
      favoriteFoodId: 'T5_FARM_CABBAGE',
      babyId: 'T5_FARM_GOOSE_BABY',
      adultId: 'T5_FARM_GOOSE_GROWN',
      produceId: 'T5_EGG',
      produceYield: 10,
      meatId: 'T5_MEAT',
      meatYield: 20,
    ),
    AnimalProduct(
      id: 'sheep',
      name: 'Sheep',
      tier: 6,
      type: 'Pasture animal',
      growthHours: 88,
      foodPerCycle: 18,
      offspringReturnRate: 86.67,
      focusOffspringReturnRate: 113.34,
      favoriteFoodId: 'T6_FARM_POTATO',
      babyId: 'T6_FARM_SHEEP_BABY',
      adultId: 'T6_FARM_SHEEP_GROWN',
      produceId: 'T6_MILK',
      produceYield: 10,
      meatId: 'T6_MEAT',
      meatYield: 20,
    ),
    AnimalProduct(
      id: 'pig',
      name: 'Pig',
      tier: 7,
      type: 'Pasture animal',
      growthHours: 110,
      foodPerCycle: 18,
      offspringReturnRate: 91.11,
      focusOffspringReturnRate: 108.89,
      favoriteFoodId: 'T7_FARM_CORN',
      babyId: 'T7_FARM_PIG_BABY',
      adultId: 'T7_FARM_PIG_GROWN',
      meatId: 'T7_MEAT',
      meatYield: 20,
    ),
    AnimalProduct(
      id: 'cow',
      name: 'Cow',
      tier: 8,
      type: 'Pasture animal',
      growthHours: 132,
      foodPerCycle: 18,
      offspringReturnRate: 93.33,
      focusOffspringReturnRate: 106.66,
      favoriteFoodId: 'T8_FARM_PUMPKIN',
      babyId: 'T8_FARM_COW_BABY',
      adultId: 'T8_FARM_COW_GROWN',
      produceId: 'T8_MILK',
      produceYield: 10,
      meatId: 'T8_MEAT',
      meatYield: 20,
    ),
    AnimalProduct(
      id: 'horse',
      name: 'Horse',
      tier: 3,
      type: 'Mount',
      growthHours: 44,
      foodPerCycle: 10,
      offspringReturnRate: 84,
      focusOffspringReturnRate: 104,
      favoriteFoodId: 'T3_FARM_WHEAT',
      babyId: 'T3_MOUNT_HORSE_FOAL',
      adultId: 'T3_MOUNT_HORSE',
    ),
    AnimalProduct(
      id: 'ox',
      name: 'Ox',
      tier: 3,
      type: 'Mount',
      growthHours: 44,
      foodPerCycle: 10,
      offspringReturnRate: 84,
      focusOffspringReturnRate: 104,
      favoriteFoodId: 'T3_FARM_WHEAT',
      babyId: 'T3_MOUNT_OX_CALF',
      adultId: 'T3_MOUNT_OX',
    ),
  ];

  static const farmingProducts = [
    FarmingProduct(
      id: 'carrot',
      name: 'Carrot',
      tier: 1,
      type: 'crop',
      seedId: 'T1_FARM_CARROT_SEED',
      produceId: 'T1_CARROT',
      baseYield: 8,
      seedReturnRate: 0,
      seedReturnRateWithFocus: 200,
      focusCost: 100,
    ),
    FarmingProduct(
      id: 'bean',
      name: 'Bean',
      tier: 2,
      type: 'crop',
      seedId: 'T2_FARM_BEAN_SEED',
      produceId: 'T2_BEAN',
      baseYield: 8,
      seedReturnRate: 80,
      seedReturnRateWithFocus: 180,
      focusCost: 200,
    ),
    FarmingProduct(
      id: 'wheat',
      name: 'Wheat',
      tier: 3,
      type: 'crop',
      seedId: 'T3_FARM_WHEAT_SEED',
      produceId: 'T3_WHEAT',
      baseYield: 8,
      seedReturnRate: 86.67,
      seedReturnRateWithFocus: 186.67,
      focusCost: 300,
    ),
    FarmingProduct(
      id: 'turnip',
      name: 'Turnip',
      tier: 4,
      type: 'crop',
      seedId: 'T4_FARM_TURNIP_SEED',
      produceId: 'T4_TURNIP',
      baseYield: 8,
      seedReturnRate: 91.11,
      seedReturnRateWithFocus: 191.11,
      focusCost: 400,
    ),
    FarmingProduct(
      id: 'cabbage',
      name: 'Cabbage',
      tier: 5,
      type: 'crop',
      seedId: 'T5_FARM_CABBAGE_SEED',
      produceId: 'T5_CABBAGE',
      baseYield: 8,
      seedReturnRate: 93.33,
      seedReturnRateWithFocus: 193.33,
      focusCost: 500,
    ),
    FarmingProduct(
      id: 'potato',
      name: 'Potato',
      tier: 6,
      type: 'crop',
      seedId: 'T6_FARM_POTATO_SEED',
      produceId: 'T6_POTATO',
      baseYield: 8,
      seedReturnRate: 94.44,
      seedReturnRateWithFocus: 194.44,
      focusCost: 600,
    ),
    FarmingProduct(
      id: 'corn',
      name: 'Corn',
      tier: 7,
      type: 'crop',
      seedId: 'T7_FARM_CORN_SEED',
      produceId: 'T7_CORN',
      baseYield: 8,
      seedReturnRate: 95.24,
      seedReturnRateWithFocus: 195.24,
      focusCost: 700,
    ),
    FarmingProduct(
      id: 'pumpkin',
      name: 'Pumpkin',
      tier: 8,
      type: 'crop',
      seedId: 'T8_FARM_PUMPKIN_SEED',
      produceId: 'T8_PUMPKIN',
      baseYield: 8,
      seedReturnRate: 96.15,
      seedReturnRateWithFocus: 196.15,
      focusCost: 800,
    ),
    FarmingProduct(
      id: 'agaric',
      name: 'Agaric',
      tier: 2,
      type: 'herb',
      seedId: 'T2_FARM_AGARIC_SEED',
      produceId: 'T2_AGARIC',
      baseYield: 8,
      seedReturnRate: 80,
      seedReturnRateWithFocus: 180,
      focusCost: 200,
    ),
    FarmingProduct(
      id: 'comfrey',
      name: 'Comfrey',
      tier: 3,
      type: 'herb',
      seedId: 'T3_FARM_COMFREY_SEED',
      produceId: 'T3_COMFREY',
      baseYield: 8,
      seedReturnRate: 86.67,
      seedReturnRateWithFocus: 186.67,
      focusCost: 300,
    ),
    FarmingProduct(
      id: 'burdock',
      name: 'Burdock',
      tier: 4,
      type: 'herb',
      seedId: 'T4_FARM_BURDOCK_SEED',
      produceId: 'T4_BURDOCK',
      baseYield: 8,
      seedReturnRate: 91.11,
      seedReturnRateWithFocus: 191.11,
      focusCost: 400,
    ),
    FarmingProduct(
      id: 'teasel',
      name: 'Teasel',
      tier: 5,
      type: 'herb',
      seedId: 'T5_FARM_TEASEL_SEED',
      produceId: 'T5_TEASEL',
      baseYield: 8,
      seedReturnRate: 93.33,
      seedReturnRateWithFocus: 193.33,
      focusCost: 500,
    ),
    FarmingProduct(
      id: 'foxglove',
      name: 'Foxglove',
      tier: 6,
      type: 'herb',
      seedId: 'T6_FARM_FOXGLOVE_SEED',
      produceId: 'T6_FOXGLOVE',
      baseYield: 8,
      seedReturnRate: 94.44,
      seedReturnRateWithFocus: 194.44,
      focusCost: 600,
    ),
    FarmingProduct(
      id: 'mullein',
      name: 'Mullein',
      tier: 7,
      type: 'herb',
      seedId: 'T7_FARM_MULLEIN_SEED',
      produceId: 'T7_MULLEIN',
      baseYield: 8,
      seedReturnRate: 95.24,
      seedReturnRateWithFocus: 195.24,
      focusCost: 700,
    ),
    FarmingProduct(
      id: 'yarrow',
      name: 'Yarrow',
      tier: 8,
      type: 'herb',
      seedId: 'T8_FARM_YARROW_SEED',
      produceId: 'T8_YARROW',
      baseYield: 8,
      seedReturnRate: 96.15,
      seedReturnRateWithFocus: 196.15,
      focusCost: 800,
    ),
  ];

  static const cookingRecipes = [
    CookingRecipe(
      id: 'T4_MEAL_STEW',
      name: 'Goat Stew',
      category: 'stew',
      tier: 4,
      productId: 'T4_MEAL_STEW',
      ingredients: [
        CookingIngredient(itemId: 'T4_MEAT', name: 'Raw Goat', count: 18),
        CookingIngredient(itemId: 'T4_TURNIP', name: 'Turnips', count: 18),
        CookingIngredient(itemId: 'T4_BREAD', name: 'Bread', count: 9),
      ],
    ),
    CookingRecipe(
      id: 'T6_MEAL_STEW',
      name: 'Mutton Stew',
      category: 'stew',
      tier: 6,
      productId: 'T6_MEAL_STEW',
      ingredients: [
        CookingIngredient(itemId: 'T6_MEAT', name: 'Raw Mutton', count: 36),
        CookingIngredient(itemId: 'T6_POTATO', name: 'Potatoes', count: 36),
        CookingIngredient(itemId: 'T4_BREAD', name: 'Bread', count: 18),
      ],
    ),
    CookingRecipe(
      id: 'T8_MEAL_STEW',
      name: 'Beef Stew',
      category: 'stew',
      tier: 8,
      productId: 'T8_MEAL_STEW',
      ingredients: [
        CookingIngredient(itemId: 'T8_MEAT', name: 'Raw Beef', count: 72),
        CookingIngredient(itemId: 'T6_POTATO', name: 'Potatoes', count: 72),
        CookingIngredient(itemId: 'T7_CORN', name: 'Bundle of Corn', count: 36),
      ],
    ),
    CookingRecipe(
      id: 'T4_MEAL_SANDWICH',
      name: 'Goat Sandwich',
      category: 'sandwich',
      tier: 4,
      productId: 'T4_MEAL_SANDWICH',
      ingredients: [
        CookingIngredient(itemId: 'T4_BREAD', name: 'Bread', count: 18),
        CookingIngredient(itemId: 'T4_MEAT', name: 'Raw Goat', count: 18),
        CookingIngredient(itemId: 'T4_BUTTER', name: 'Goat Butter', count: 9),
      ],
    ),
    CookingRecipe(
      id: 'T6_MEAL_SANDWICH',
      name: 'Mutton Sandwich',
      category: 'sandwich',
      tier: 6,
      productId: 'T6_MEAL_SANDWICH',
      ingredients: [
        CookingIngredient(itemId: 'T4_BREAD', name: 'Bread', count: 36),
        CookingIngredient(itemId: 'T6_MEAT', name: 'Raw Mutton', count: 36),
        CookingIngredient(itemId: 'T6_BUTTER', name: 'Sheep Butter', count: 18),
      ],
    ),
    CookingRecipe(
      id: 'T8_MEAL_SANDWICH',
      name: 'Beef Sandwich',
      category: 'sandwich',
      tier: 8,
      productId: 'T8_MEAL_SANDWICH',
      ingredients: [
        CookingIngredient(itemId: 'T4_BREAD', name: 'Bread', count: 72),
        CookingIngredient(itemId: 'T8_MEAT', name: 'Raw Beef', count: 72),
        CookingIngredient(itemId: 'T8_BUTTER', name: 'Cow Butter', count: 36),
      ],
    ),
    CookingRecipe(
      id: 'T1_MEAL_SOUP',
      name: 'Carrot Soup',
      category: 'soup',
      tier: 1,
      productId: 'T1_MEAL_SOUP',
      ingredients: [
        CookingIngredient(itemId: 'T1_CARROT', name: 'Carrots', count: 16),
      ],
    ),
    CookingRecipe(
      id: 'T3_MEAL_SOUP',
      name: 'Wheat Soup',
      category: 'soup',
      tier: 3,
      productId: 'T3_MEAL_SOUP',
      ingredients: [
        CookingIngredient(
          itemId: 'T3_WHEAT',
          name: 'Sheaf of Wheat',
          count: 32,
        ),
        CookingIngredient(itemId: 'T3_FLOUR', name: 'Flour', count: 16),
      ],
    ),
    CookingRecipe(
      id: 'T5_MEAL_SOUP',
      name: 'Cabbage Soup',
      category: 'soup',
      tier: 5,
      productId: 'T5_MEAL_SOUP',
      ingredients: [
        CookingIngredient(itemId: 'T5_CABBAGE', name: 'Cabbage', count: 48),
        CookingIngredient(itemId: 'T3_FLOUR', name: 'Flour', count: 16),
      ],
    ),
    CookingRecipe(
      id: 'T3_MEAL_ROAST',
      name: 'Roast Chicken',
      category: 'roast',
      tier: 3,
      productId: 'T3_MEAL_ROAST',
      ingredients: [
        CookingIngredient(itemId: 'T3_MEAT', name: 'Raw Chicken', count: 16),
        CookingIngredient(itemId: 'T2_BEAN', name: 'Beans', count: 16),
        CookingIngredient(itemId: 'T4_MILK', name: 'Goat Milk', count: 8),
      ],
    ),
    CookingRecipe(
      id: 'T5_MEAL_ROAST',
      name: 'Roast Goose',
      category: 'roast',
      tier: 5,
      productId: 'T5_MEAL_ROAST',
      ingredients: [
        CookingIngredient(itemId: 'T5_MEAT', name: 'Raw Goose', count: 32),
        CookingIngredient(itemId: 'T5_CABBAGE', name: 'Cabbage', count: 32),
        CookingIngredient(itemId: 'T6_MILK', name: 'Sheep Milk', count: 16),
      ],
    ),
    CookingRecipe(
      id: 'T7_MEAL_ROAST',
      name: 'Roast Pork',
      category: 'roast',
      tier: 7,
      productId: 'T7_MEAL_ROAST',
      ingredients: [
        CookingIngredient(itemId: 'T7_MEAT', name: 'Raw Pork', count: 64),
        CookingIngredient(itemId: 'T7_CORN', name: 'Bundle of Corn', count: 64),
        CookingIngredient(itemId: 'T8_MILK', name: 'Cow Milk', count: 32),
      ],
    ),
    CookingRecipe(
      id: 'T3_MEAL_PIE',
      name: 'Chicken Pie',
      category: 'pie',
      tier: 3,
      productId: 'T3_MEAL_PIE',
      ingredients: [
        CookingIngredient(itemId: 'T3_MEAT', name: 'Raw Chicken', count: 8),
        CookingIngredient(
          itemId: 'T3_WHEAT',
          name: 'Sheaf of Wheat',
          count: 16,
        ),
        CookingIngredient(itemId: 'T3_FLOUR', name: 'Flour', count: 8),
      ],
    ),
    CookingRecipe(
      id: 'T5_MEAL_PIE',
      name: 'Goose Pie',
      category: 'pie',
      tier: 5,
      productId: 'T5_MEAL_PIE',
      ingredients: [
        CookingIngredient(itemId: 'T5_MEAT', name: 'Raw Goose', count: 16),
        CookingIngredient(itemId: 'T5_CABBAGE', name: 'Cabbage', count: 32),
        CookingIngredient(itemId: 'T3_FLOUR', name: 'Flour', count: 16),
        CookingIngredient(itemId: 'T4_MILK', name: 'Goat Milk', count: 8),
      ],
    ),
    CookingRecipe(
      id: 'T7_MEAL_PIE',
      name: 'Pork Pie',
      category: 'pie',
      tier: 7,
      productId: 'T7_MEAL_PIE',
      ingredients: [
        CookingIngredient(itemId: 'T7_MEAT', name: 'Raw Pork', count: 32),
        CookingIngredient(itemId: 'T7_CORN', name: 'Bundle of Corn', count: 64),
        CookingIngredient(itemId: 'T3_FLOUR', name: 'Flour', count: 32),
        CookingIngredient(itemId: 'T6_MILK', name: 'Sheep Milk', count: 16),
      ],
    ),
    CookingRecipe(
      id: 'T3_MEAL_OMELETTE',
      name: 'Chicken Omelette',
      category: 'omelette',
      tier: 3,
      productId: 'T3_MEAL_OMELETTE',
      ingredients: [
        CookingIngredient(itemId: 'T3_MEAT', name: 'Raw Chicken', count: 8),
        CookingIngredient(itemId: 'T3_EGG', name: 'Hen Eggs', count: 16),
        CookingIngredient(itemId: 'T3_WHEAT', name: 'Sheaf of Wheat', count: 4),
      ],
    ),
    CookingRecipe(
      id: 'T5_MEAL_OMELETTE',
      name: 'Goose Omelette',
      category: 'omelette',
      tier: 5,
      productId: 'T5_MEAL_OMELETTE',
      ingredients: [
        CookingIngredient(itemId: 'T5_MEAT', name: 'Raw Goose', count: 16),
        CookingIngredient(itemId: 'T5_EGG', name: 'Goose Eggs', count: 32),
        CookingIngredient(itemId: 'T5_CABBAGE', name: 'Cabbage', count: 8),
      ],
    ),
    CookingRecipe(
      id: 'T7_MEAL_OMELETTE',
      name: 'Pork Omelette',
      category: 'omelette',
      tier: 7,
      productId: 'T7_MEAL_OMELETTE',
      ingredients: [
        CookingIngredient(itemId: 'T7_MEAT', name: 'Raw Pork', count: 32),
        CookingIngredient(itemId: 'T5_EGG', name: 'Goose Eggs', count: 64),
        CookingIngredient(itemId: 'T7_CORN', name: 'Bundle of Corn', count: 16),
      ],
    ),
    CookingRecipe(
      id: 'T2_MEAL_SALAD',
      name: 'Bean Salad',
      category: 'salad',
      tier: 2,
      productId: 'T2_MEAL_SALAD',
      ingredients: [
        CookingIngredient(itemId: 'T2_BEAN', name: 'Beans', count: 16),
        CookingIngredient(itemId: 'T1_CARROT', name: 'Carrots', count: 8),
      ],
    ),
    CookingRecipe(
      id: 'T4_MEAL_SALAD',
      name: 'Turnip Salad',
      category: 'salad',
      tier: 4,
      productId: 'T4_MEAL_SALAD',
      ingredients: [
        CookingIngredient(itemId: 'T4_TURNIP', name: 'Turnips', count: 32),
        CookingIngredient(itemId: 'T2_BEAN', name: 'Beans', count: 16),
        CookingIngredient(itemId: 'T3_WHEAT', name: 'Sheaf of Wheat', count: 8),
      ],
    ),
    CookingRecipe(
      id: 'T6_MEAL_SALAD',
      name: 'Potato Salad',
      category: 'salad',
      tier: 6,
      productId: 'T6_MEAL_SALAD',
      ingredients: [
        CookingIngredient(itemId: 'T6_POTATO', name: 'Potatoes', count: 64),
        CookingIngredient(itemId: 'T4_TURNIP', name: 'Turnips', count: 32),
        CookingIngredient(itemId: 'T2_BEAN', name: 'Beans', count: 16),
      ],
    ),
  ];

  static const cookingSauces = [
    (id: 'T4_FISHSAUCE_LEVEL1', name: 'Basic Fish Sauce'),
    (id: 'T6_FISHSAUCE_LEVEL2', name: 'Fancy Fish Sauce'),
    (id: 'T8_FISHSAUCE_LEVEL3', name: 'Special Fish Sauce'),
  ];

  Future<AlbionKitApiStatus> getApiStatus() => _apiClient.getApiStatus();

  Future<List<PlayerSearchResult>> searchPlayers(
    String query, {
    String region = 'west',
  }) async {
    final rawResults = await _apiClient.searchPlayers(query, region: region);
    return rawResults
        .map(PlayerSearchResult.fromJson)
        .where((result) => result.name.isNotEmpty)
        .toList();
  }

  Future<List<GuildSearchResult>> searchGuilds(
    String query, {
    String region = 'west',
  }) async {
    final rawResults = await _apiClient.searchGuilds(query, region: region);
    return rawResults
        .map(GuildSearchResult.fromJson)
        .where((result) => result.name.isNotEmpty)
        .toList();
  }

  Future<Map<String, dynamic>> getPlayerProfile(
    String playerId, {
    String region = 'west',
  }) {
    return _apiClient.getPlayerProfile(playerId, region: region);
  }

  Future<Map<String, dynamic>> getGuildInfo(
    String guildId, {
    String region = 'west',
  }) {
    return _apiClient.getGuildInfo(guildId, region: region);
  }

  Future<List<ItemSearchResult>> searchItems(
    String query, {
    int limit = 10,
  }) async {
    final rawResults = await _apiClient.searchItems(query, limit: limit);
    return rawResults
        .map(ItemSearchResult.fromJson)
        .where((result) => result.name.isNotEmpty)
        .toList();
  }

  Future<List<ArmoryBuild>> searchArmory({
    String query = '',
    int limit = 6,
  }) async {
    final rawResults = await _apiClient.searchArmory(
      query: query,
      limit: limit,
    );
    return rawResults
        .map(ArmoryBuild.fromJson)
        .where((result) => result.title.isNotEmpty)
        .toList();
  }

  Future<List<GoldPricePoint>> getGoldHistory({
    String region = 'west',
    int count = 168,
  }) async {
    final rawPoints = await _apiClient.getGoldHistory(
      region: region,
      count: count,
    );
    return rawPoints
        .map(
          (point) => GoldPricePoint(
            price: point.price,
            timestamp:
                DateTime.tryParse(point.timestamp) ??
                DateTime.fromMillisecondsSinceEpoch(0),
          ),
        )
        .toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }

  Future<List<MarketFlip>> getMarketFlips({
    required String region,
    int minProfit = 50000,
  }) async {
    final rawFlips = await _apiClient.getMarketFlips(
      region: region,
      minProfit: minProfit,
    );
    return rawFlips
        .map(MarketFlip.fromJson)
        .where((flip) => flip.itemId.isNotEmpty)
        .toList();
  }

  Future<List<FarmingProfitResult>> getFarmingProfits({
    required String region,
    required String productType,
    required String seedCity,
    required String produceCity,
    required int plots,
    required int cycles,
    required double customReturnRate,
    required bool premium,
    required bool useFocus,
  }) async {
    const cities = {
      'Martlock',
      'Bridgewatch',
      'Lymhurst',
      'Fort Sterling',
      'Thetford',
      'Caerleon',
      'Brecilien',
      'Black Market',
    };
    if (!cities.contains(seedCity) || !cities.contains(produceCity)) {
      throw ArgumentError('Select a valid Albion market city.');
    }
    if (plots < 1 || plots > 24 || cycles < 1 || cycles > 100) {
      throw ArgumentError('Plots or cycles are outside the supported range.');
    }
    if (customReturnRate < 0 || customReturnRate > 100) {
      throw ArgumentError.value(
        customReturnRate,
        'customReturnRate',
        'Return rate must be between 0 and 100.',
      );
    }
    final products = farmingProducts
        .where((product) => product.type == productType)
        .toList();
    final seedIds = products.map((product) => product.seedId).toList();
    final produceIds = products.map((product) => product.produceId).toList();
    final allIds = [...seedIds, ...produceIds];
    final responses = await Future.wait([
      _apiClient.getMarketPrices(
        itemIds: allIds,
        region: region,
        locations: {seedCity, produceCity}.toList(),
      ),
      _apiClient.getMarketHistory(
        itemIds: seedIds,
        region: region,
        location: seedCity,
      ),
      _apiClient.getMarketHistory(
        itemIds: produceIds,
        region: region,
        location: produceCity,
      ),
    ]);
    final prices = responses[0];
    final seedHistory = responses[1];
    final produceHistory = responses[2];

    int priceFor(String itemId, String city) {
      for (final row in prices) {
        if (row['item_id'] == itemId &&
            row['city'] == city &&
            row['sell_price_min'] is num) {
          final price = (row['sell_price_min'] as num).toInt();
          if (price > 0) return price;
        }
      }
      return 0;
    }

    int volumeFor(List<Map<String, dynamic>> history, String itemId) {
      for (final row in history) {
        if (row['item_id'] != itemId || row['data'] is! List) continue;
        final points = row['data'] as List;
        if (points.isEmpty || points.last is! Map) continue;
        final volume = (points.last as Map)['item_count'];
        if (volume is num) return volume.toInt();
      }
      return 0;
    }

    return products.map((product) {
      final seedPrice = priceFor(product.seedId, seedCity);
      final producePrice = priceFor(product.produceId, produceCity);
      final seedReturnRate = useFocus
          ? (customReturnRate > 0
                ? customReturnRate
                : product.seedReturnRateWithFocus)
          : 0.0;
      final expectedYield = product.baseYield * (premium ? 2 : 1);
      final exactRevenuePerSeed =
          expectedYield * producePrice + seedReturnRate / 100 * seedPrice;
      final netProfitBeforeRounding = exactRevenuePerSeed - seedPrice;
      final revenuePerSeed = exactRevenuePerSeed.round();
      final netProfitPerSeed = netProfitBeforeRounding.round();
      final totalProfit = (netProfitBeforeRounding * plots * cycles).round();
      final warning = seedPrice == 0
          ? 'No seed price data'
          : producePrice == 0
          ? 'No produce price data'
          : null;
      return FarmingProfitResult(
        product: product,
        seedPrice: seedPrice,
        seedVolume: volumeFor(seedHistory, product.seedId),
        producePrice: producePrice,
        produceVolume: volumeFor(produceHistory, product.produceId),
        expectedYield: expectedYield,
        effectiveSeedReturnRate: seedReturnRate,
        revenuePerSeed: revenuePerSeed,
        netProfitPerSeed: netProfitPerSeed,
        totalProfit: totalProfit,
        roi: seedPrice == 0 ? 0 : netProfitPerSeed / seedPrice * 100,
        warning: warning,
      );
    }).toList();
  }

  Future<List<AnimalProfitResult>> getAnimalProfits({
    required String region,
    required String activity,
    required String buyCity,
    required String sellCity,
    required int quantity,
    required bool premium,
    required bool favoriteFood,
    required bool useFocus,
  }) async {
    const cities = {
      'Martlock',
      'Bridgewatch',
      'Lymhurst',
      'Fort Sterling',
      'Thetford',
      'Caerleon',
      'Brecilien',
      'Black Market',
    };
    if (!cities.contains(buyCity) || !cities.contains(sellCity)) {
      throw ArgumentError('Select valid Albion market cities.');
    }
    if (quantity < 1 || quantity > 999) {
      throw ArgumentError.value(
        quantity,
        'quantity',
        'Must be from 1 to 999 (one stack).',
      );
    }
    if (!{'breeding', 'products', 'butchering'}.contains(activity)) {
      throw ArgumentError.value(
        activity,
        'activity',
        'Unknown animal activity.',
      );
    }

    final animals = animalProducts.where((animal) {
      switch (activity) {
        case 'products':
          return animal.produceId != null;
        case 'butchering':
          return animal.meatId != null;
        default:
          return true;
      }
    }).toList();
    final allItemIds = <String>{
      'T1_CARROT',
      for (final animal in animals) ...[
        animal.babyId,
        animal.adultId,
        animal.favoriteFoodId,
        if (animal.produceId != null) animal.produceId!,
        if (animal.meatId != null) animal.meatId!,
      ],
    }.toList();
    final priceRows = await _apiClient.getMarketPrices(
      itemIds: allItemIds,
      region: region,
      locations: {buyCity, sellCity}.toList(),
    );

    int priceFor(String itemId, String city) {
      for (final row in priceRows) {
        if (row['item_id'] == itemId &&
            row['city'] == city &&
            row['sell_price_min'] is num) {
          final price = (row['sell_price_min'] as num).toInt();
          if (price > 0) return price;
        }
      }
      return 0;
    }

    return animals.map((animal) {
      final babyPrice = priceFor(animal.babyId, buyCity);
      final adultPrice = priceFor(
        animal.adultId,
        activity == 'butchering' ? buyCity : sellCity,
      );
      final foodId = favoriteFood ? animal.favoriteFoodId : 'T1_CARROT';
      final foodPrice = priceFor(foodId, buyCity);
      final foodQuantity =
          (animal.foodPerCycle * animal.cycles * (favoriteFood ? .5 : 1))
              .toDouble();
      final foodCost = (foodPrice * foodQuantity).round();
      final offspringRate = useFocus
          ? animal.focusOffspringReturnRate
          : animal.offspringReturnRate;
      final producePrice = animal.produceId == null
          ? 0
          : priceFor(animal.produceId!, sellCity);
      final meatPrice = animal.meatId == null
          ? 0
          : priceFor(animal.meatId!, sellCity);

      late double outputYield;
      late int outputRevenue;
      late int cost;
      switch (activity) {
        case 'products':
          outputYield = animal.produceYield * (premium ? 1 : .5);
          outputRevenue = (outputYield * producePrice).round();
          cost = foodCost;
        case 'butchering':
          outputYield = animal.meatYield.toDouble();
          outputRevenue = outputYield.toInt() * meatPrice;
          cost = adultPrice;
        default:
          outputYield = 1;
          outputRevenue = (adultPrice + babyPrice * offspringRate / 100)
              .round();
          cost = babyPrice + foodCost;
      }
      final profit = outputRevenue - cost;
      final warning = switch (activity) {
        'products' =>
          foodPrice == 0
              ? 'No food price data'
              : producePrice == 0
              ? 'No product price data'
              : null,
        'butchering' =>
          adultPrice == 0
              ? 'No adult animal price data'
              : meatPrice == 0
              ? 'No meat price data'
              : null,
        _ =>
          babyPrice == 0
              ? 'No baby animal price data'
              : adultPrice == 0
              ? 'No grown animal price data'
              : foodPrice == 0
              ? 'No food price data'
              : null,
      };

      return AnimalProfitResult(
        animal: animal,
        activity: activity,
        quantity: quantity,
        buyCity: buyCity,
        sellCity: sellCity,
        babyPrice: babyPrice,
        adultPrice: adultPrice,
        foodId: foodId,
        foodPrice: foodPrice,
        favoriteFoodPrice: favoriteFood ? foodPrice : 0,
        foodQuantity: foodQuantity,
        foodCost: foodCost,
        offspringReturnRate: offspringRate,
        producePrice: producePrice,
        meatPrice: meatPrice,
        outputYield: outputYield,
        outputRevenue: outputRevenue,
        cost: cost,
        profit: profit,
        profitPerPlot: profit * 9,
        totalProfit: profit * quantity,
        roi: cost == 0 ? 0 : profit / cost * 100,
        growthHours: animal.growthHours / (premium ? 2 : 1),
        warning: warning,
      );
    }).toList()..sort((a, b) => b.profit.compareTo(a.profit));
  }

  Future<List<AlchemyProfitResult>> getAlchemyProfits({
    required String region,
    required String recipeId,
    required String sellCity,
    required Map<String, String> ingredientCities,
    required int quantity,
    required bool enchanted,
    required bool premium,
    required bool sellOrder,
    required bool includeSellFees,
    required double returnRate,
    required int usageFee,
  }) async {
    const cities = {
      'Martlock',
      'Bridgewatch',
      'Lymhurst',
      'Fort Sterling',
      'Thetford',
      'Caerleon',
      'Brecilien',
      'Black Market',
    };
    if (!cities.contains(sellCity) ||
        ingredientCities.values.any((city) => !cities.contains(city))) {
      throw ArgumentError('Select valid Albion market cities.');
    }
    if (quantity < 1 || quantity > 999) {
      throw ArgumentError.value(quantity, 'quantity', 'Must be from 1 to 999.');
    }
    if (returnRate < 0 || returnRate > 100 || usageFee < 0) {
      throw ArgumentError(
        'Return rate or usage fee is outside the valid range.',
      );
    }
    final matching = alchemyRecipes.where((recipe) => recipe.id == recipeId);
    if (matching.isEmpty) {
      throw ArgumentError.value(
        recipeId,
        'recipeId',
        'Unknown alchemy recipe.',
      );
    }
    final recipe = matching.first;
    final enchantments = enchanted ? [0, 1, 2, 3] : [0];
    final outputIds = enchantments
        .map(
          (level) =>
              level == 0 ? recipe.idForOutput : '${recipe.idForOutput}@$level',
        )
        .toList();
    final ingredientIds = <String>{
      for (final ingredient in recipe.ingredients)
        for (final level in enchantments)
          ingredient.enchantable && level > 0
              ? '${ingredient.itemId}@$level'
              : ingredient.itemId,
    };
    final citiesForRequest = {
      sellCity,
      ...recipe.ingredients.map(
        (ingredient) => ingredientCities[ingredient.itemId] ?? 'Martlock',
      ),
    };
    final priceRows = await _apiClient.getMarketPrices(
      itemIds: {...outputIds, ...ingredientIds}.toList(),
      region: region,
      locations: citiesForRequest.toList(),
    );
    int priceFor(String id, String city) =>
        _positiveMarketPrice(priceRows, id, city);
    final sellRate = includeSellFees
        ? (premium ? .04 : .08) + (sellOrder ? .025 : 0)
        : 0.0;
    final stationFee = (usageFee * quantity / recipe.batchYield * 5).round();

    return enchantments.map((level) {
      final productId = level == 0
          ? recipe.idForOutput
          : '${recipe.idForOutput}@$level';
      final ingredients = recipe.ingredients.map((ingredient) {
        final itemId = ingredient.enchantable && level > 0
            ? '${ingredient.itemId}@$level'
            : ingredient.itemId;
        final city = ingredientCities[ingredient.itemId] ?? 'Martlock';
        final unitPrice = priceFor(itemId, city);
        final needed = ingredient.quantity * quantity / recipe.batchYield;
        return ToolIngredientCost(
          ingredient: ingredient,
          itemId: itemId,
          city: city,
          unitPrice: unitPrice,
          quantity: needed,
          totalCost: unitPrice * needed,
        );
      }).toList();
      final rawIngredientCost = ingredients.fold<double>(
        0,
        (sum, row) => sum + row.totalCost,
      );
      final ingredientCost = (rawIngredientCost * (1 - returnRate / 100))
          .round();
      final productPrice = priceFor(productId, sellCity);
      final revenue = (productPrice * quantity * (1 - sellRate)).round();
      final totalCost = ingredientCost + stationFee;
      final profit = revenue - totalCost;
      final warning = productPrice == 0
          ? 'No potion price data'
          : ingredients.any((row) => row.unitPrice == 0)
          ? 'Some ingredient prices are unavailable'
          : null;
      return AlchemyProfitResult(
        recipe: recipe,
        enchantment: level,
        quantity: quantity,
        productId: productId,
        sellCity: sellCity,
        productPrice: productPrice,
        ingredients: ingredients,
        ingredientCost: ingredientCost,
        stationFee: stationFee,
        revenue: revenue,
        totalCost: totalCost,
        profit: profit,
        roi: totalCost == 0 ? 0 : profit / totalCost * 100,
        returnRate: returnRate,
        warning: warning,
      );
    }).toList()..sort((a, b) => b.profit.compareTo(a.profit));
  }

  Future<List<ChoppedFishProfitResult>> getChoppedFishProfits({
    required String region,
    required String buyCity,
    required String sellCity,
    required int targetChops,
    required bool premium,
    required bool buyOrder,
    required bool includeTax,
  }) async {
    const cities = {
      'Martlock',
      'Bridgewatch',
      'Lymhurst',
      'Fort Sterling',
      'Thetford',
      'Caerleon',
      'Brecilien',
      'Black Market',
    };
    if (!cities.contains(buyCity) || !cities.contains(sellCity)) {
      throw ArgumentError('Select valid Albion market cities.');
    }
    if (targetChops < 1 || targetChops > 999) {
      throw ArgumentError.value(
        targetChops,
        'targetChops',
        'Must be from 1 to 999.',
      );
    }
    final ids = {
      'T1_FISHCHOPS',
      ...choppedFishProducts.map((fish) => fish.id),
    }.toList();
    final priceRows = await _apiClient.getMarketPrices(
      itemIds: ids,
      region: region,
      locations: {buyCity, sellCity}.toList(),
    );
    final outputPrice = _positiveMarketPrice(
      priceRows,
      'T1_FISHCHOPS',
      sellCity,
    );
    final taxRate = includeTax ? (premium ? .04 : .08) + .025 : 0.0;
    return choppedFishProducts.map((fish) {
      final fishPrice = _positiveMarketPrice(priceRows, fish.id, buyCity);
      final requiredFish = (targetChops / fish.chopsPerFish).ceil();
      final fishCost = (fishPrice * requiredFish * (buyOrder ? 1.025 : 1))
          .round();
      final revenue =
          (outputPrice * fish.chopsPerFish * requiredFish * (1 - taxRate))
              .round();
      final profit = revenue - fishCost;
      return ChoppedFishProfitResult(
        fish: fish,
        targetChops: targetChops,
        fishRequired: requiredFish,
        buyCity: buyCity,
        sellCity: sellCity,
        fishPrice: fishPrice,
        choppedFishPrice: outputPrice,
        fishCost: fishCost,
        revenue: revenue,
        profit: profit,
        roi: fishCost == 0 ? 0 : profit / fishCost * 100,
        warning: fishPrice == 0
            ? 'No fish price data'
            : outputPrice == 0
            ? 'No chopped fish price data'
            : null,
      );
    }).toList()..sort((a, b) => b.profit.compareTo(a.profit));
  }

  Future<List<LabourerProfitResult>> getLabourerProfits({
    required String region,
    required String labourerId,
    required String buyCity,
    required String sellCity,
    required int houseTier,
    required int journalCount,
    required bool premium,
    required bool sellOrder,
    required bool includeEnchantedReturns,
  }) async {
    const cities = {
      'Martlock',
      'Bridgewatch',
      'Lymhurst',
      'Fort Sterling',
      'Thetford',
      'Caerleon',
      'Brecilien',
      'Black Market',
    };
    if (!cities.contains(buyCity) || !cities.contains(sellCity)) {
      throw ArgumentError('Select valid Albion market cities.');
    }
    if (houseTier < 2 ||
        houseTier > 8 ||
        journalCount < 1 ||
        journalCount > 999) {
      throw ArgumentError(
        'House tier or journal count is outside the valid range.',
      );
    }
    final matching = labourerTypes.where((type) => type.id == labourerId);
    if (matching.isEmpty) {
      throw ArgumentError.value(labourerId, 'labourerId', 'Unknown labourer.');
    }
    final labourer = matching.first;
    const tiers = [2, 3, 4, 5, 6, 7, 8];
    final enchantments = includeEnchantedReturns ? [0, 1, 2, 3] : [0];
    final itemIds = <String>{
      for (final tier in tiers) ...[
        labourer.journalId(tier, full: true),
        labourer.journalId(tier, full: false),
        for (final level in enchantments)
          if (labourer.returnItemId(tier, enchantment: level) != null)
            labourer.returnItemId(tier, enchantment: level)!,
      ],
    };
    final rows = await _apiClient.getMarketPrices(
      itemIds: itemIds.toList(),
      region: region,
      locations: {buyCity, sellCity}.toList(),
    );
    double baseReturn(int tier) {
      const crafting = {
        2: 38.0,
        3: 24.0,
        4: 16.0,
        5: 8.0,
        6: 5.3,
        7: 4.5,
        8: 4.1,
      };
      const gathering = {
        2: 38.0,
        3: 60.0,
        4: 48.0,
        5: 32.0,
        6: 32.0,
        7: 38.4,
        8: 38.4,
      };
      return (labourer.category == 'crafting' ? crafting : gathering)[tier] ??
          0;
    }

    final tax = premium ? .04 : .08;
    return tiers.map((tier) {
      final fullId = labourer.journalId(tier, full: true);
      final emptyId = labourer.journalId(tier, full: false);
      final fullPrice = _positiveMarketPrice(rows, fullId, buyCity);
      final emptyPrice = _positiveMarketPrice(rows, emptyId, sellCity);
      final yieldMultiplier = houseTier >= tier
          ? 1.5
          : (1 - .1 * (tier - houseTier)).clamp(.1, 1.0);
      final returnedQuantity =
          baseReturn(tier) * yieldMultiplier * journalCount;
      final materials = <LabourerMaterialResult>[];
      if (labourer.id != 'mercenary') {
        for (final level in enchantments) {
          final materialId = labourer.returnItemId(tier, enchantment: level);
          if (materialId == null) continue;
          final materialPrice = _positiveMarketPrice(
            rows,
            materialId,
            sellCity,
          );
          materials.add(
            LabourerMaterialResult(
              itemId: materialId,
              enchantment: level,
              quantity: returnedQuantity,
              price: materialPrice,
              value: (returnedQuantity * materialPrice).round(),
            ),
          );
        }
      }
      final emptyRevenue =
          (emptyPrice * journalCount * (1 - tax - (sellOrder ? .025 : 0)))
              .round();
      final materialRevenue = materials.fold<int>(
        0,
        (sum, material) => sum + material.value,
      );
      final totalCost = fullPrice * journalCount;
      final totalRevenue = emptyRevenue + materialRevenue;
      final profit = totalRevenue - totalCost;
      final warning = fullPrice == 0
          ? 'No full journal price data'
          : emptyPrice == 0
          ? 'No empty journal price data'
          : labourer.id != 'mercenary' &&
                materials.any((material) => material.price == 0)
          ? 'Some returned material prices are unavailable'
          : null;
      return LabourerProfitResult(
        labourer: labourer,
        tier: tier,
        houseTier: houseTier,
        journalCount: journalCount,
        fullJournalId: fullId,
        emptyJournalId: emptyId,
        fullJournalPrice: fullPrice,
        emptyJournalPrice: emptyPrice,
        emptyJournalRevenue: emptyRevenue,
        yieldPercent: yieldMultiplier * 100,
        materials: materials,
        materialRevenue: materialRevenue,
        totalCost: totalCost,
        totalRevenue: totalRevenue,
        profit: profit,
        roi: totalCost == 0 ? 0 : profit / totalCost * 100,
        warning: warning,
      );
    }).toList()..sort((a, b) => b.profit.compareTo(a.profit));
  }

  int _positiveMarketPrice(
    List<Map<String, dynamic>> rows,
    String itemId,
    String city,
  ) {
    for (final row in rows) {
      if (row['item_id'] == itemId &&
          row['city'] == city &&
          row['sell_price_min'] is num) {
        final price = (row['sell_price_min'] as num).toInt();
        if (price > 0) return price;
      }
    }
    return 0;
  }

  Future<List<CookingProfitResult>> getCookingProfits({
    required String region,
    required String recipeId,
    required String sellCity,
    required Map<String, String> ingredientCities,
    required int quantity,
    required bool enchanted,
    required bool includeBuyTax,
    required bool includeSellTax,
    required bool sellOrder,
    required bool dailyBonus,
    required bool useFocus,
    required double? customReturnRate,
    required int usageFee,
  }) async {
    const cities = {
      'Martlock',
      'Bridgewatch',
      'Lymhurst',
      'Fort Sterling',
      'Thetford',
      'Caerleon',
      'Brecilien',
      'Black Market',
    };
    if (!cities.contains(sellCity) ||
        ingredientCities.values.any((city) => !cities.contains(city))) {
      throw ArgumentError('Select valid Albion market cities.');
    }
    if (quantity < 1 || quantity > 999) {
      throw ArgumentError.value(
        quantity,
        'quantity',
        'Must be from 1 to 999 (one stack).',
      );
    }
    if (usageFee < 0) {
      throw ArgumentError.value(usageFee, 'usageFee', 'Cannot be negative.');
    }
    if (customReturnRate != null &&
        (customReturnRate < 0 || customReturnRate > 100)) {
      throw ArgumentError.value(
        customReturnRate,
        'customReturnRate',
        'Return rate must be from 0 to 100.',
      );
    }

    final recipe = cookingRecipes.where((entry) => entry.id == recipeId);
    if (recipe.isEmpty) {
      throw ArgumentError.value(
        recipeId,
        'recipeId',
        'Unknown cooking recipe.',
      );
    }
    final selectedRecipe = recipe.first;
    final returnRate = customReturnRate != null && customReturnRate > 0
        ? customReturnRate
        : useFocus
        ? 43.5
        : dailyBonus
        ? 25.2
        : 15.2;
    final enchantments = enchanted ? [0, 1, 2, 3] : [0];
    final productIds = enchantments
        .map(
          (level) => level == 0
              ? selectedRecipe.productId
              : '${selectedRecipe.productId}@$level',
        )
        .toList();
    final sauceIds = cookingSauces.map((sauce) => sauce.id).toList();
    final itemIds = {
      ...selectedRecipe.ingredients.map((ingredient) => ingredient.itemId),
      ...productIds,
      ...sauceIds,
    }.toList();
    final locations = {
      sellCity,
      ...selectedRecipe.ingredients.map(
        (ingredient) => ingredientCities[ingredient.itemId] ?? 'Martlock',
      ),
      'Lymhurst',
    }.toList();
    final responses = await Future.wait([
      _apiClient.getMarketPrices(
        itemIds: itemIds,
        region: region,
        locations: locations,
      ),
      _apiClient.getMarketHistory(
        itemIds: productIds,
        region: region,
        location: sellCity,
      ),
    ]);
    final priceRows = responses[0];
    final historyRows = responses[1];

    int priceFor(String itemId, String city) {
      for (final row in priceRows) {
        if (row['item_id'] == itemId &&
            row['city'] == city &&
            row['sell_price_min'] is num) {
          final price = (row['sell_price_min'] as num).toInt();
          if (price > 0) return price;
        }
      }
      return 0;
    }

    int volumeFor(String itemId) {
      for (final row in historyRows) {
        if (row['item_id'] != itemId || row['data'] is! List) continue;
        final points = row['data'] as List;
        if (points.isEmpty || points.last is! Map) continue;
        final volume = (points.last as Map)['item_count'];
        if (volume is num) return volume.toInt();
      }
      return 0;
    }

    return enchantments.map((level) {
      final productId = level == 0
          ? selectedRecipe.productId
          : '${selectedRecipe.productId}@$level';
      final ingredientPrices = selectedRecipe.ingredients.map((ingredient) {
        final city = ingredientCities[ingredient.itemId] ?? 'Martlock';
        final unitPrice = priceFor(ingredient.itemId, city);
        final neededQuantity =
            ingredient.count * quantity / selectedRecipe.yield;
        final totalCost =
            unitPrice *
            neededQuantity *
            (1 - returnRate / 100) *
            (includeBuyTax ? 1.025 : 1);
        return CookingIngredientPrice(
          ingredient: ingredient,
          city: city,
          unitPrice: unitPrice,
          quantity: neededQuantity,
          totalCost: totalCost,
        );
      }).toList();

      final sauce = level == 0 ? null : cookingSauces[level - 1];
      final saucePrice = sauce == null ? 0 : priceFor(sauce.id, 'Lymhurst');
      final sauceCost = saucePrice * quantity * (includeBuyTax ? 1.025 : 1);
      final ingredientCost = ingredientPrices
          .fold<double>(0, (sum, item) => sum + item.totalCost)
          .round();
      final adjustedSauceCost = sauceCost.round();
      final allIngredientPrices = [
        ...ingredientPrices,
        if (sauce != null)
          CookingIngredientPrice(
            ingredient: CookingIngredient(
              itemId: sauce.id,
              name: sauce.name,
              count: 1,
            ),
            city: 'Lymhurst',
            unitPrice: saucePrice,
            quantity: quantity.toDouble(),
            totalCost: sauceCost.toDouble(),
          ),
      ];
      final stationFee = (usageFee * (quantity / selectedRecipe.yield) * 5)
          .round();
      final totalCost = ingredientCost + adjustedSauceCost + stationFee;
      final productPrice = priceFor(productId, sellCity);
      final sellFees = (includeSellTax ? 0.04 : 0) + (sellOrder ? 0.025 : 0);
      final revenue = (productPrice * quantity * (1 - sellFees)).round();
      final profit = revenue - totalCost;
      final missingItemIds = [
        if (productPrice == 0) productId,
        for (final entry in ingredientPrices)
          if (entry.unitPrice == 0) entry.ingredient.itemId,
        if (sauce != null && saucePrice == 0) sauce.id,
      ];
      final missingItems = [
        if (productPrice == 0) selectedRecipe.name,
        for (final entry in ingredientPrices)
          if (entry.unitPrice == 0) entry.ingredient.name,
        if (sauce != null && saucePrice == 0) sauce.name,
      ];
      final displayName = level == 0
          ? selectedRecipe.name
          : '${selectedRecipe.name} (T${selectedRecipe.tier}.$level)';

      return CookingProfitResult(
        recipe: selectedRecipe,
        productId: productId,
        displayName: displayName,
        enchantment: level,
        quantity: quantity,
        productPrice: productPrice,
        productVolume: volumeFor(productId),
        ingredients: allIngredientPrices,
        sauceId: sauce?.id,
        sauceName: sauce?.name,
        saucePrice: saucePrice,
        ingredientCost: ingredientCost,
        sauceCost: adjustedSauceCost,
        stationFee: stationFee,
        revenue: revenue,
        totalCost: totalCost,
        profit: profit,
        roi: totalCost == 0 ? 0 : profit / totalCost * 100,
        returnRate: returnRate,
        totalWeight: selectedRecipe.itemWeight * quantity,
        warning: missingItems.isEmpty
            ? null
            : 'No market price: ${missingItems.join(', ')}',
        missingItemIds: missingItemIds,
      );
    }).toList();
  }

  Future<String?> getLocalizedItemName(
    String itemId, {
    required String languageCode,
  }) async {
    final canonicalId = itemId.split('@').first.trim().toUpperCase();
    if (canonicalId.isEmpty) return null;
    var names = _localizedItemNames[canonicalId];
    if (names == null) {
      names = _gameInfoApi.getItemLocalizedNames(canonicalId).catchError((
        Object error,
      ) {
        _localizedItemNames.remove(canonicalId);
        throw error;
      });
      _localizedItemNames[canonicalId] = names;
    }
    final localizedNames = await names;
    final locale = AppLanguage.gameInfoLocaleFor(languageCode);
    final name = localizedNames[locale] ?? localizedNames['EN-US'];
    return name?.trim().isNotEmpty == true ? name : null;
  }

  Future<ProfitCalculation> calculateProfit({
    required String type,
    required String itemId,
    required int quantity,
    required String region,
  }) async {
    if (quantity < 1 || quantity > 999) {
      throw ArgumentError.value(
        quantity,
        'quantity',
        'Must be from 1 to 999 (one stack).',
      );
    }
    final response = await _apiClient.calculateProfit(
      type: type,
      itemId: itemId,
      quantity: quantity,
      region: region,
    );
    final data = response['data'] is Map
        ? Map<String, dynamic>.from(response['data'] as Map)
        : response;
    return ProfitCalculation.fromJson(data);
  }
}
