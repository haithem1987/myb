namespace Myb.Coproperty.Models.Dtos;

/// <summary>
/// Counts displayed next to collection entries in the syndic sidebar.
/// All values are scoped to coproperties the authenticated user can manage.
/// </summary>
public sealed class SyndicMenuCounts
{
    public int Coproperties { get; init; }
    public int Budgets { get; init; }
    public int Units { get; init; }
    public int Owners { get; init; }
    public int Tenants { get; init; }
    public int FundCalls { get; init; }
    public int ChargePayments { get; init; }
    public int Interventions { get; init; }
    public int Signalements { get; init; }
    public int Discussions { get; init; }
}
