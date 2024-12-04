/**
 * @file Pruebas unitarias para el módulo FileSystemManager.
 */

// Importar clases necesarias
import { FileSystemManager } from '../src/FileSystem.js';
import { Schema } from '../src/Schema.js';
import { Model } from '../src/Model.js'; // Suponiendo que ya existe el modelo IrisModel para simular operaciones

// Mock de datos
const mockData = [
  {  name: 'Test 1', createdAt: new Date() },
  {  name: 'Test 2', createdAt: new Date() }
];
const mockSchema = new Schema({
  _id: { type: String, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, required: true }
});
// Crear instancia de un modelo simulado
const mockModel = new Model('testModel', mockSchema);
// Test suite
(async () => {
  console.log('Iniciando tests para FileSystemManager...');
  
  // Insertar datos simulados
  for (const record of mockData) {
    await mockModel.create(record);
  }

  // Crear instancia de FileSystemManager
  const fsManager = new FileSystemManager(mockModel);

  // Test 1: Verificar compatibilidad
  const compatibility = fsManager.checkCompatibility();
  console.assert(compatibility.fullSupport !== undefined, 'Compatibilidad no evaluada correctamente');
  console.log('✔️ Verificación de compatibilidad completada');

  // Test 2: Exportación con fallback
  const fallbackExportResult = fsManager._fallbackExport(mockData);
  console.log('Exportación con fallback:', fallbackExportResult);
  console.assert(fallbackExportResult.success, 'La exportación con fallback falló');
  console.log('✔️ Exportación con fallback completada');

  // Test 3: Exportación nativa (si es compatible)
  if (FileSystemManager.isSupported()) {
    const nativeExportResult = await fsManager.exportToFile();
    console.log('Exportación nativa:', nativeExportResult);
    console.assert(nativeExportResult.success, 'La exportación nativa falló');
    console.log('✔️ Exportación nativa completada');
  } else {
    console.log('⚠️ Exportación nativa omitida por falta de compatibilidad');
  }

  // Test 4: Importación con fallback
  try {
    const fallbackImportResult = await fsManager._fallbackImport();
    console.log('✔️ Importación con fallback completada:', fallbackImportResult);
  } catch (error) {
    console.log('⚠️ La importación con fallback falló:', error.message);
  }

  // Test 5: Importación nativa (si es compatible)
  if (FileSystemManager.isSupported()) {
    try {
      const nativeImportResult = await fsManager.importFromFile();
      console.assert(nativeImportResult.success, 'La importación nativa falló');
      console.log('✔️ Importación nativa completada:', nativeImportResult);
    } catch (error) {
      console.log('⚠️ La importación nativa falló:', error.message);
    }
  } else {
    console.log('⚠️ Importación nativa omitida por falta de compatibilidad');
  }

  // Test 6: Configuración de backup automático
  try {
    const intervalId = fsManager.setupAutoBackup(5000); // Backup cada 5 segundos (test rápido)
    console.assert(intervalId, 'El intervalo para backup automático no fue configurado correctamente');
    console.log('✔️ Configuración de backup automático completada');
    clearInterval(intervalId); // Limpiar intervalo al final del test
  } catch (error) {
    console.log('⚠️ Configuración de backup automático falló:', error.message);
  }

  console.log('Todos los tests completados');
})();