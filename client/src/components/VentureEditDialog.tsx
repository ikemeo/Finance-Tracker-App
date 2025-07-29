import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertVentureSchema, type VentureInvestment, type InsertVenture } from '@shared/schema';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';

// Form schema with string dates for HTML inputs
const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  sector: z.string().min(1, "Sector is required"),
  stage: z.string().min(1, "Stage is required"),
  investmentDate: z.string().min(1, "Investment date is required"),
  investmentAmount: z.string().min(1, "Investment amount is required"),
  currentValuation: z.string().optional(),
  ownershipPercentage: z.string().optional(),
  leadInvestor: z.string().optional(),
  exitDate: z.string().optional(),
  exitAmount: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VentureEditDialogProps {
  investment: VentureInvestment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VentureEditDialog({ investment, open, onOpenChange }: VentureEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: investment.companyName,
      sector: investment.sector,
      stage: investment.stage,
      investmentDate: investment.investmentDate instanceof Date 
        ? investment.investmentDate.toISOString().split('T')[0]
        : new Date(investment.investmentDate).toISOString().split('T')[0],
      investmentAmount: investment.investmentAmount,
      currentValuation: investment.currentValuation || '',
      ownershipPercentage: investment.ownershipPercentage || '',
      leadInvestor: investment.leadInvestor || '',
      exitDate: investment.exitDate 
        ? (investment.exitDate instanceof Date 
            ? investment.exitDate.toISOString().split('T')[0]
            : new Date(investment.exitDate).toISOString().split('T')[0])
        : '',
      exitAmount: investment.exitAmount || '',
      status: investment.status,
      notes: investment.notes || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Convert form data to API format - keep dates as strings for JSON serialization
      const formattedData: any = {
        companyName: data.companyName,
        sector: data.sector,
        stage: data.stage,
        investmentDate: data.investmentDate, // Keep as string
        investmentAmount: data.investmentAmount,
        currentValuation: data.currentValuation || null,
        ownershipPercentage: data.ownershipPercentage && data.ownershipPercentage.trim() !== '' ? data.ownershipPercentage : null,
        leadInvestor: data.leadInvestor || null,
        exitDate: data.exitDate || null, // Keep as string
        exitAmount: data.exitAmount || null,
        status: data.status,
        notes: data.notes || null,
      };
      return apiRequest(`/api/venture/${investment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Investment Updated",
        description: "Your venture investment has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/venture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update venture investment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Investment</DialogTitle>
          <DialogDescription>
            Update the details of your venture investment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                        <SelectItem value="artificial-intelligence">AI</SelectItem>
                        <SelectItem value="biotech">Biotech</SelectItem>
                        <SelectItem value="e-commerce">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="consumer">Consumer</SelectItem>
                        <SelectItem value="energy">Energy</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="series-a">Series A</SelectItem>
                        <SelectItem value="series-b">Series B</SelectItem>
                        <SelectItem value="series-c">Series C</SelectItem>
                        <SelectItem value="late-stage">Late Stage</SelectItem>
                        <SelectItem value="ipo">IPO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="exited">Exited</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="investmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="investmentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentValuation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Valuation ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownershipPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership (%) - Optional</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="leadInvestor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Investor (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Andreessen Horowitz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('status') === 'exited' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="exitDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exitAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this investment..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Update Investment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}