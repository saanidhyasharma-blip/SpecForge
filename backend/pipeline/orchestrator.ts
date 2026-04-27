import { extractIntent, type Intent } from "./intent";
import {
  generateDesign as generateSystemDesign,
  type Design
} from "./design";

export { generateDesign as generateSystemDesign } from "./design";
import { generateSchema as generateFullSchema, type FullSchema } from "./schema";
import { validateDB, validateAPI, validateUI, validateAuth, crossValidate, type ValidationError } from "./validation";
import { repairSchema as performRepair } from "./repair";
import { simulateExecution } from "../runtime/simulate";


// ValidationResult interface removed as it is now flattened onto ValidationOutput

type DesignOutput = {
  step: "generateDesign";
  data: {
    intent: Intent;
    design: Design;
  };
};

type SchemaOutput = {
  step: "generateSchema";
  data: {
    design: DesignOutput;
    schema: FullSchema;
  };
};

type ValidationOutput = {
  step: "validateSchema";
  success: boolean;
  errors: ValidationError[];
  data: {
    schema: SchemaOutput;
  };
};

type RepairOutput = {
  step: "repairSchema";
  data: {
    schema: SchemaOutput;
    errors: ValidationError[];
    repaired: boolean;
    repairedSchema: FullSchema;
  };
};

type PipelineOutput = SchemaOutput | RepairOutput;

export async function generateDesign(intent: Intent): Promise<DesignOutput> {
  const design = await generateSystemDesign(intent);

  return {
    step: "generateDesign",
    data: {
      intent,
      design
    }
  };
}

export async function generateSchema(design: DesignOutput): Promise<SchemaOutput> {
  return {
    step: "generateSchema",
    data: {
      design,
      schema: generateFullSchema(design.data.design)
    }
  };
}

export async function validateSchema(schema: SchemaOutput): Promise<ValidationOutput> {
  const s = schema.data.schema;
  const dbErrors = validateDB(s.db);
  const apiErrors = validateAPI(s.api);
  const uiErrors = validateUI(s.ui);
  const authErrors = validateAuth(s.auth);
  const crossErrors = crossValidate(s);

  const errors = [...dbErrors, ...apiErrors, ...uiErrors, ...authErrors, ...crossErrors];

  return {
    step: "validateSchema",
    success: errors.length === 0,
    errors,
    data: {
      schema
    }
  };
}

export async function runPipeline(userInput: string) {
  const intent = await extractIntent(userInput);
  const design = await generateSystemDesign(intent);
  
  const schemaObj: SchemaOutput = {
    step: "generateSchema",
    data: {
      design: { step: "generateDesign", data: { intent, design } },
      schema: generateFullSchema(design)
    }
  };

  let validation = await validateSchema(schemaObj);
  const originalErrors = validation.errors ? [...validation.errors] : [];
  let repaired = false;

  if (!validation.success) {
    const repairedSchema = await performRepair(schemaObj.data.schema, validation.errors);
    schemaObj.data.schema = repairedSchema;
    repaired = true;
    
    // Re-verify the schema after deterministic patches are applied.
    validation = await validateSchema(schemaObj);
  }

  const finalSchema = schemaObj.data.schema;
  const execution = simulateExecution(finalSchema);

  if (!execution.success) {
    console.log("Execution failed:", execution.message);
  }

  return {
    schema: finalSchema,
    execution,
    repaired,
    originalErrors
  };
}
