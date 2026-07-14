import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function parse(filePath) {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
}

function findVariableInitializer(sourceFile, variableName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(sourceFile) === variableName) {
        return declaration.initializer;
      }
    }
  }
  throw new Error(`Missing variable ${variableName} in ${sourceFile.fileName}`);
}

function propertyName(property, sourceFile) {
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
    return property.name.text;
  }
  return property.name.getText(sourceFile);
}

function objectKeys(objectLiteral, sourceFile) {
  assert.ok(ts.isObjectLiteralExpression(objectLiteral));
  return objectLiteral.properties
    .filter(ts.isPropertyAssignment)
    .map((property) => propertyName(property, sourceFile));
}

function stringProperty(objectLiteral, sourceFile, name) {
  assert.ok(ts.isObjectLiteralExpression(objectLiteral));
  const property = objectLiteral.properties.find((candidate) => (
    ts.isPropertyAssignment(candidate) && propertyName(candidate, sourceFile) === name
  ));
  assert.ok(property && ts.isPropertyAssignment(property));
  assert.ok(ts.isStringLiteral(property.initializer));
  return property.initializer.text;
}

function numericConstant(sourceFile, name) {
  const initializer = findVariableInitializer(sourceFile, name);
  assert.ok(initializer && ts.isNumericLiteral(initializer));
  return Number(initializer.text);
}

const typesFile = parse('src/types.ts');
const actionsFile = parse('src/ranch/data/statusActions.ts');
const animalsFile = parse('src/ranch/data/agentAnimals.ts');
const agentCoreFile = parse('src/lib/agentCore.ts');
const notificationsFile = parse('src/ranch/hooks/useRanchNotifications.ts');
const statusBandFile = parse('src/ranch/components/StatusBand.tsx');

const statusAlias = typesFile.statements.find((statement) => (
  ts.isTypeAliasDeclaration(statement) && statement.name.text === 'NiuMaStatus'
));
assert.ok(statusAlias && ts.isUnionTypeNode(statusAlias.type));
const statuses = statusAlias.type.types.map((typeNode) => {
  assert.ok(ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal));
  return typeNode.literal.text;
});

const actionKeys = objectKeys(findVariableInitializer(actionsFile, 'STATUS_ACTIONS'), actionsFile);
const animalInitializer = findVariableInitializer(animalsFile, 'AGENT_ANIMALS');
const seedInitializer = findVariableInitializer(agentCoreFile, 'AGENT_SEEDS');
assert.ok(animalInitializer && ts.isArrayLiteralExpression(animalInitializer));
assert.ok(seedInitializer && ts.isArrayLiteralExpression(seedInitializer));
const animalIds = animalInitializer.elements.map((element) => stringProperty(element, animalsFile, 'agentId'));
const seedIds = seedInitializer.elements.map((element) => stringProperty(element, agentCoreFile, 'id'));

assert.equal(statuses.length, 14, 'NiuMaStatus must retain 14 visible states.');
assert.deepEqual([...actionKeys].sort(), [...statuses].sort(), 'Every NiuMaStatus needs one explicit action mapping.');
assert.equal(animalIds.length, 8, 'The ranch must expose eight configured animal identities.');
assert.equal(new Set(animalIds).size, 8, 'Animal identities must be unique.');
assert.deepEqual([...animalIds].sort(), [...seedIds].sort(), 'Animal identities must match seed truth exactly.');
assert.equal(numericConstant(notificationsFile, 'MAX_TOASTS'), 1, 'Only one ranch toast may be visible.');
assert.equal(numericConstant(notificationsFile, 'TOAST_TTL_MS'), 1500, 'Ranch toast TTL must stay transient at 1500ms.');

const statusBandSource = statusBandFile.getFullText();
assert.match(statusBandSource, /const activeMessage = messages\[0\]/);
assert.equal((statusBandSource.match(/<NotificationToast\b/g) ?? []).length, 1);

console.log('ranch status coverage check passed.');
console.log(`identities=${animalIds.length}, statuses=${statuses.length}, maxToasts=1, toastTtlMs=1500`);
console.log(`agents=${animalIds.join(',')}`);
