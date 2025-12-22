import { IRecipeRepository, DatabaseProvider, DatabaseConfig } from "./types";
import { LocalStorageRepository } from "./LocalStorageRepository";
import { SupabaseRepository } from "./SupabaseRepository";
import { AWSRepository } from "./AWSRepository";
import { FirebaseRepository } from "./FirebaseRepository";

export * from "./types";
export { LocalStorageRepository } from "./LocalStorageRepository";
export { SupabaseRepository } from "./SupabaseRepository";
export { AWSRepository } from "./AWSRepository";
export { FirebaseRepository } from "./FirebaseRepository";

// Singleton instance
let repositoryInstance: IRecipeRepository | null = null;

/**
 * Factory function to create the appropriate repository based on configuration.
 *
 * Usage:
 *
 * // For localStorage (default)
 * const repo = createRepository({ provider: 'localStorage' });
 *
 * // For Supabase (requires Lovable Cloud)
 * const repo = createRepository({
 *   provider: 'supabase',
 *   supabaseUrl: '...',
 *   supabaseKey: '...'
 * });
 *
 * // For AWS DynamoDB
 * const repo = createRepository({
 *   provider: 'aws',
 *   awsRegion: 'us-east-1',
 *   awsTableName: 'recipes'
 * });
 */
export function createRepository(config: DatabaseConfig): IRecipeRepository {
  switch (config.provider) {
    case "firebase":
      if (!config.firebaseConfig) {
        throw new Error("Firebase config is required");
      }
      return new FirebaseRepository(config.firebaseConfig);
    case "supabase":
      return new SupabaseRepository();
    case "aws":
      return new AWSRepository();
    case "localStorage":
    default:
      return new LocalStorageRepository();
  }
}

/**
 * Get the current repository instance.
 * Creates a localStorage repository if none exists.
 */
export function getRepository(): IRecipeRepository {
  if (!repositoryInstance) {
    repositoryInstance = new LocalStorageRepository();
  }
  return repositoryInstance;
}

/**
 * Initialize the repository with specific configuration.
 * Call this at app startup to set up the desired database provider.
 *
 * Example:
 *
 * // In main.tsx or App.tsx
 * initializeRepository({ provider: 'localStorage' });
 *
 * // Later, when switching to Supabase
 * initializeRepository({ provider: 'supabase', supabaseUrl: '...', supabaseKey: '...' });
 */
export function initializeRepository(
  config: DatabaseConfig
): IRecipeRepository {
  repositoryInstance = createRepository(config);
  return repositoryInstance;
}

/**
 * Get current database provider type
 */
export function getCurrentProvider(): DatabaseProvider {
  if (repositoryInstance instanceof FirebaseRepository) return "firebase";
  if (repositoryInstance instanceof SupabaseRepository) return "supabase";
  if (repositoryInstance instanceof AWSRepository) return "aws";
  return "localStorage";
}
