import { names, uniqueNamesGenerator } from "unique-names-generator";
import { ActionExample, type Evaluator } from "./types.ts";
import { stringArrayFooter } from "./parsing.ts";

/**
 * Template used for the evaluation generateText.
 */
export const evaluationTemplate =
    `TASK: Based on the conversation and conditions, determine which evaluation functions are appropriate to call.
Examples:
{{evaluatorExamples}}

INSTRUCTIONS: You are helping me to decide which appropriate functions to call based on the conversation between {{senderName}} and {{agentName}}.

{{recentMessages}}

Evaluator Functions:
{{evaluators}}

TASK: Based on the most recent conversation, determine which evaluators functions are appropriate to call to call.
Include the name of evaluators that are relevant and should be called in the array
Available evaluator names to include are {{evaluatorNames}}
` + stringArrayFooter;

/**
 * Formats the names of evaluators into a comma-separated list, each enclosed in single quotes.
 * @param evaluators - An array of evaluator objects.
 * @returns A string that concatenates the names of all evaluators, each enclosed in single quotes and separated by commas.
 */
export function formatEvaluatorNames(evaluators: Evaluator[]) {
    console.log(" [formatEvaluatorNames] Input evaluators:", evaluators.map(e => ({
        name: e.name,
        description: e.description
    })));

    const names = evaluators
        .map((evaluator: Evaluator) => `'${evaluator.name}'`)
        .join(",\n");
    
    console.log(" [formatEvaluatorNames] Formatted names for LLM:", names);
    return names;
}

/**
 * Formats evaluator details into a string, including both the name and description of each evaluator.
 * @param evaluators - An array of evaluator objects.
 * @returns A string that concatenates the name and description of each evaluator, separated by a colon and a newline character.
 */
export function formatEvaluators(evaluators: Evaluator[]) {
    console.log(" [formatEvaluators] Formatting evaluators with descriptions");

    const formatted = evaluators
        .map(
            (evaluator: Evaluator) => {
                const str = `'${evaluator.name}: ${evaluator.description}'`;
                console.log(" [formatEvaluators] Formatted evaluator:", str);
                return str;
            }
        )
        .join(",\n");
    return formatted;
}

/**
 * Formats evaluator examples into a readable string, replacing placeholders with generated names.
 * @param evaluators - An array of evaluator objects, each containing examples to format.
 * @returns A string that presents each evaluator example in a structured format, including context, messages, and outcomes, with placeholders replaced by generated names.
 */
export function formatEvaluatorExamples(evaluators: Evaluator[]) {
    console.log(" [formatEvaluatorExamples] Starting example formatting for:", 
        evaluators.map(e => e.name));

    const examples = evaluators
        .map((evaluator) => {
            if (!evaluator.examples || evaluator.examples.length === 0) {
                console.log(` [formatEvaluatorExamples] No examples for ${evaluator.name}`);
                return "";
            }

            console.log(` [formatEvaluatorExamples] Found ${evaluator.examples.length} examples for ${evaluator.name}`);
            
            return evaluator.examples
                .map((example, idx) => {
                    console.log(` [formatEvaluatorExamples] Processing example ${idx + 1} for ${evaluator.name}`);
                    
                    const exampleNames = Array.from({ length: 5 }, () =>
                        uniqueNamesGenerator({ dictionaries: [names] })
                    );

                    let formattedContext = example.context;
                    let formattedOutcome = example.outcome;

                    exampleNames.forEach((name, index) => {
                        const placeholder = `{{user${index + 1}}}`;
                        formattedContext = formattedContext.replaceAll(
                            placeholder,
                            name
                        );
                        formattedOutcome = formattedOutcome.replaceAll(
                            placeholder,
                            name
                        );
                    });

                    const formattedMessages = example.messages
                        .map((message: ActionExample) => {
                            let messageString = `${message.user}: ${message.content.text}`;
                            exampleNames.forEach((name, index) => {
                                const placeholder = `{{user${index + 1}}}`;
                                messageString = messageString.replaceAll(
                                    placeholder,
                                    name
                                );
                            });
                            const actionStr = message.content.action
                                ? ` (${message.content.action})`
                                : "";
                            console.log(` [formatEvaluatorExamples] Message:`, messageString + actionStr);
                            return messageString + actionStr;
                        })
                        .join("\n");

                    const formatted = `Context:\n${formattedContext}\n\nMessages:\n${formattedMessages}\n\nOutcome:\n${formattedOutcome}`;
                    console.log(` [formatEvaluatorExamples] Formatted example for ${evaluator.name}:`, formatted);
                    return formatted;
                })
                .join("\n\n");
        })
        .join("\n\n");

    console.log(" [formatEvaluatorExamples] Final examples:", examples);
    return examples;
}

/**
 * Generates a string summarizing the descriptions of each evaluator example.
 * @param evaluators - An array of evaluator objects, each containing examples.
 * @returns A string that summarizes the descriptions for each evaluator example, formatted with the evaluator name, example number, and description.
 */
export function formatEvaluatorExampleDescriptions(evaluators: Evaluator[]) {
    return evaluators
        .map((evaluator) =>
            evaluator.examples
                .map(
                    (_example, index) =>
                        `${evaluator.name} Example ${index + 1}: ${evaluator.description}`
                )
                .join("\n")
        )
        .join("\n\n");
}
