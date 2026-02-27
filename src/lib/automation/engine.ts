// AUTOMATION ENGINE
// Executes automation rules based on domain events

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Condition = {
  field: string;
  operator: 'equals' | 'in' | 'contains' | 'greater_than' | 'less_than';
  value: any;
};

type Action = 
  | { type: 'create_task'; params: { type: string; priority: string; subject: string; assignedTo?: string } }
  | { type: 'create_exception'; params: { type: string; severity: string; summary: string } }
  | { type: 'send_message'; params: { channel: string; template: string; recipient: string } }
  | { type: 'update_status'; params: { entityType: string; newStatus: string } }
  | { type: 'assign_operator'; params: { operatorId?: string } }
  | { type: 'call_webhook'; params: { url: string; payload: any } };

export class AutomationEngine {
  /**
   * Trigger automation rules for a domain event
   */
  static async processEvent(eventId: string) {
    const event = await prisma.domainEvent.findUnique({
      where: { id: eventId }
    });
    
    if (!event) return;
    
    // Find matching rules
    const rules = await prisma.automationRule.findMany({
      where: {
        status: 'active',
        trigger: event.eventType
      }
    });
    
    // Execute each rule
    for (const rule of rules) {
      await this.executeRule(rule.id, event);
    }
  }
  
  /**
   * Execute a single rule
   */
  static async executeRule(ruleId: string, event: any) {
    // Check for existing execution (deduplication)
    const existing = await prisma.automationExecution.findUnique({
      where: {
        ruleId_eventId: {
          ruleId,
          eventId: event.id
        }
      }
    });
    
    if (existing) {
      console.log(`Rule ${ruleId} already executed for event ${event.id}`);
      return;
    }
    
    // Create execution record
    const execution = await prisma.automationExecution.create({
      data: {
        ruleId,
        eventId: event.id,
        status: 'running',
        logs: { started: new Date() }
      }
    });
    
    try {
      const rule = await prisma.automationRule.findUnique({
        where: { id: ruleId }
      });
      
      if (!rule) throw new Error('Rule not found');
      
      const conditions = rule.conditions as any as Condition[];
      const actions = rule.actions as any as Action[];
      
      // Check conditions
      const conditionsMet = this.checkConditions(conditions, event.payload);
      
      if (!conditionsMet) {
        await prisma.automationExecution.update({
          where: { id: execution.id },
          data: {
            status: 'done',
            finishedAt: new Date(),
            logs: { message: 'Conditions not met' }
          }
        });
        return;
      }
      
      // Execute actions
      const actionResults = [];
      for (const action of actions) {
        const result = await this.executeAction(action, event.payload);
        actionResults.push(result);
      }
      
      // Mark as done
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'done',
          finishedAt: new Date(),
          logs: { actions: actionResults }
        }
      });
      
    } catch (error: any) {
      // Mark as failed
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          logs: { error: error.message }
        }
      });
    }
  }
  
  /**
   * Check if conditions are met
   */
  static checkConditions(conditions: Condition[], payload: any): boolean {
    return conditions.every(condition => {
      const value = this.getNestedValue(payload, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        default:
          return false;
      }
    });
  }
  
  /**
   * Execute a single action
   */
  static async executeAction(action: Action, context: any) {
    switch (action.type) {
      case 'create_task':
        await prisma.task.create({
          data: {
            type: action.params.type,
            status: 'open',
            priority: action.params.priority,
            subject: action.params.subject,
            entityType: context.entityType || 'unknown',
            entityId: context.entityId || context.id,
            assignedTo: action.params.assignedTo
          }
        });
        return { action: 'create_task', success: true };
        
      case 'create_exception':
        await prisma.exception.create({
          data: {
            type: action.params.type,
            status: 'open',
            severity: action.params.severity,
            entityType: context.entityType || 'unknown',
            entityId: context.entityId || context.id,
            summary: action.params.summary,
            details: context
          }
        });
        return { action: 'create_exception', success: true };
        
      case 'send_message':
        // Queue notification
        await prisma.domainEvent.create({
          data: {
            eventType: 'notification.send',
            entityType: 'notification',
            entityId: 'auto',
            payload: {
              channel: action.params.channel,
              template: action.params.template,
              recipient: action.params.recipient,
              data: context
            }
          }
        });
        return { action: 'send_message', success: true };
        
      case 'update_status':
        // This would need entity-specific logic
        return { action: 'update_status', success: true, note: 'Not implemented' };
        
      default:
        return { action: 'unknown', success: false };
    }
  }
  
  /**
   * Get nested value from object
   */
  static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
}

export default AutomationEngine;
